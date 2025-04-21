import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Contribution } from "../entities/Contribution";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError, BadRequestError } from "../errors/http.errors";
import { Member } from "../entities/Member";
import { GroupMember } from "../entities/GroupMember";
import { Season } from "../entities/Season";
import { Group } from "../entities/Group";
import { PaymentMethod } from "../entities/PaymentMethod";
import { User } from "../entities/User";
import { QueryParams } from "../types/QueryParams";
import { Branch } from "../entities/Branch";

export class ContributionController {
  private repository: Repository<Contribution> =
    AppDataSource.getRepository(Contribution);
  private queryBuilder: QueryBuilder<Contribution>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "contributions",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: [],
      allowedSortFields: ["createdAt", "updatedAt", "depositAmount"],
      filterableFields: [
        "member",
        "groupMember",
        "season",
        "contributionType",
        "group",
        "paymentMethod",
        "receivedBy",
      ],
    });
  }

  private format = (contribution: Contribution) => {
    return {
      ...contribution,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        groupMemberId,
        depositAmount,
        contributionType,
        paymentMethodId,
        receivedById,
        branchId,
      } = req.body;

      const groupMember = await AppDataSource.getRepository(
        GroupMember
      ).findOne({
        where: { id: groupMemberId },
        relations: ["group", "member"],
      });

      if (!groupMember) {
        return next(new NotFoundError("Group member not found"));
      }

      const branch = await AppDataSource.getRepository(Branch).findOne({
        where: { id: branchId },
      });

      if (!branch) {
        return next(new NotFoundError("Branch not found"));
      }

      const currentSeason = await AppDataSource.getRepository(Season).findOne({
        where: { status: "active" },
      });

      if (!currentSeason) {
        return next(new NotFoundError("There is no active season"));
      }

      const paymentMethod = await AppDataSource.getRepository(
        PaymentMethod
      ).findOne({
        where: { id: paymentMethodId },
      });

      if (!paymentMethod) {
        return next(new NotFoundError("Payment method not found"));
      }

      const receivedBy = await AppDataSource.getRepository(User).findOne({
        where: { id: receivedById },
      });

      if (!receivedBy) {
        return next(new NotFoundError("User not found"));
      }

      // Get current saving and solidarity amounts for the member in this season
      const lastContribution = await this.repository.findOne({
        where: {
          groupMember: { id: groupMember.id },
          season: { id: currentSeason.id },
        },
        order: { createdAt: "DESC" },
      });

      let beforeSavingAmount = 0;
      let beforeSolidalityAmount = 0;
      let currentSavingAmount = 0;
      let currentSolidalityAmount = 0;

      if (lastContribution) {
        beforeSavingAmount = lastContribution.currentSavingAmount;
        beforeSolidalityAmount = lastContribution.currentSolidalityAmount;
      }

      // Update current amounts based on contribution type
      if (contributionType === "Saving") {
        currentSavingAmount = beforeSavingAmount + Number(depositAmount);
        currentSolidalityAmount = beforeSolidalityAmount;
      } else {
        currentSavingAmount = beforeSavingAmount;
        currentSolidalityAmount =
          beforeSolidalityAmount + Number(depositAmount);
      }

      // Create new contribution
      const newContribution = this.repository.create({
        member: groupMember.member,
        groupMember,
        season: currentSeason,
        depositAmount,
        contributionType,
        currentSavingAmount,
        currentSolidalityAmount,
        beforeSavingAmount,
        beforeSolidalityAmount,
        group: groupMember.group,
        paymentMethod,
        receivedBy,
        branch: branch,
      });

      const savedContribution = await this.repository.save(newContribution);

      res.status(201).json({
        status: "success",
        data: this.format(savedContribution),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const contribution = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "member",
          "groupMember",
          "season",
          "group",
          "paymentMethod",
          "receivedBy",
          "fines",
        ],
      });

      if (!contribution) {
        return next(new NotFoundError("Contribution not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(contribution),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const {
        groupMemberId,
        depositAmount,
        contributionType,
        groupId,
        paymentMethodId,
      } = req.body;

      let contribution = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "member",
          "groupMember",
          "season",
          "group",
          "paymentMethod",
          "receivedBy",
        ],
      });

      if (!contribution) {
        return next(new NotFoundError("Contribution not found"));
      }

      if (groupMemberId) {
        const groupMember = await AppDataSource.getRepository(
          GroupMember
        ).findOne({
          where: { id: groupMemberId },
        });
        if (!groupMember) {
          return next(new NotFoundError("Group member not found"));
        }
        contribution.groupMember = groupMember;
      }

      if (groupId) {
        const group = await AppDataSource.getRepository(Group).findOne({
          where: { id: groupId },
        });
        if (!group) {
          return next(new NotFoundError("Group not found"));
        }
        contribution.group = group;
      }

      if (paymentMethodId) {
        const paymentMethod = await AppDataSource.getRepository(
          PaymentMethod
        ).findOne({
          where: { id: paymentMethodId },
        });
        if (!paymentMethod) {
          return next(new NotFoundError("Payment method not found"));
        }
        contribution.paymentMethod = paymentMethod;
      }

      // If deposit amount or contribution type changes, recalculate amounts
      if (depositAmount !== undefined || contributionType !== undefined) {
        const newDepositAmount =
          depositAmount !== undefined
            ? Number(depositAmount)
            : contribution.depositAmount;
        const newContributionType =
          contributionType || contribution.contributionType;

        // Get previous contribution to get the before amounts
        const previousContribution = await this.repository
          .createQueryBuilder("contribution")
          .where("contribution.member.id = :memberId", {
            memberId: contribution.member.id,
          })
          .andWhere("contribution.season.id = :seasonId", {
            seasonId: contribution.season.id,
          })
          .andWhere("contribution.id != :contributionId", {
            contributionId: contribution.id,
          })
          .orderBy("contribution.createdAt", "DESC")
          .getOne();

        let beforeSavingAmount = 0;
        let beforeSolidalityAmount = 0;

        if (previousContribution) {
          beforeSavingAmount = previousContribution.currentSavingAmount;
          beforeSolidalityAmount = previousContribution.currentSolidalityAmount;
        }

        // Update current amounts based on contribution type
        if (newContributionType === "Saving") {
          contribution.currentSavingAmount =
            beforeSavingAmount + newDepositAmount;
          contribution.currentSolidalityAmount = beforeSolidalityAmount;
        } else {
          contribution.currentSavingAmount = beforeSavingAmount;
          contribution.currentSolidalityAmount =
            beforeSolidalityAmount + newDepositAmount;
        }

        contribution.beforeSavingAmount = beforeSavingAmount;
        contribution.beforeSolidalityAmount = beforeSolidalityAmount;
        contribution.depositAmount = newDepositAmount;
        contribution.contributionType = newContributionType;
      }

      // Update the contribution
      const updatedContribution = await this.repository.save(contribution);

      res.status(200).json({
        status: "success",
        data: this.format(updatedContribution),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [],
        [
          "contributions.member",
          "contributions.groupMember",
          "contributions.group",
          "contributions.receivedBy",
          "contributions.paymentMethod",
          "contributions.branch",
        ]
      );

      res.json({
        ...result,
        results: result.results.map(this.format),
      });
    }
  );

  delete = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const contribution = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["fines"],
      });

      if (!contribution) {
        return next(new NotFoundError("Contribution not found"));
      }

      // Check if contribution has related fines
      if (contribution.fines?.length) {
        return next(
          new BadRequestError(
            "Cannot delete contribution with associated fines"
          )
        );
      }

      await this.repository.remove(contribution);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
