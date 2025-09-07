import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Fine } from "../entities/Fine";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError } from "../errors/http.errors";
import { Member } from "../entities/Member";
import { GroupMember } from "../entities/GroupMember";
import { Group } from "../entities/Group";
import { Contribution } from "../entities/Contribution";
import { Loan } from "../entities/Loan";
import { QueryParams } from "../types/QueryParams";
import { Branch } from "../entities/Branch";
import { User } from "../entities/User";

export class FineController {
  private repository: Repository<Fine> = AppDataSource.getRepository(Fine);
  private queryBuilder: QueryBuilder<Fine>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "fines",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: [],
      allowedSortFields: ["createdAt", "updatedAt", "amount"],
      filterableFields: [
        "member",
        "groupMember",
        "group",
        "contribution",
        "loan",
        "reason",
      ],
    });
  }

  private format = (fine: Fine) => {
    return {
      ...fine,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        groupMemberId,
        groupId,
        contributionId,
        loanId,
        reason,
        amount,
        branchId,
      } = req.body;

      const groupMember = await AppDataSource.getRepository(
        GroupMember
      ).findOne({
        where: { id: groupMemberId },
        relations: ["member"],
      });

      const branch = await AppDataSource.getRepository(Branch).findOne({
        where: { id: branchId },
      });

      if (!groupMember) {
        return next(new NotFoundError("Group member not found"));
      }

      const group = await AppDataSource.getRepository(Group).findOne({
        where: { id: groupId },
      });
      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      // Fetch optional related entities if provided
      let contribution: Contribution | null = null;
      if (contributionId) {
        contribution = await AppDataSource.getRepository(Contribution).findOne({
          where: { id: contributionId },
        });
        if (!contribution) {
          return next(new NotFoundError("Contribution not found"));
        }
      }

      let loan: Loan | null = null;
      if (loanId) {
        loan = await AppDataSource.getRepository(Loan).findOne({
          where: { id: loanId },
        });
        if (!loan) {
          return next(new NotFoundError("Loan not found"));
        }
      }

      // Fetch the user entity for createdBy
      let createdByUser = undefined;
      if (req?.user?.id) {
        createdByUser = await AppDataSource.getRepository(User).findOne({ where: { id: req.user.id } });
      }
      // Create new fine
      const fineData: any = {
        groupMember,
        group,
        contribution,
        loan,
        reason,
        amount,
        branch,
        member: groupMember.member,
      };

      // Only add createdBy if it's not null
      if (createdByUser) {
        fineData.createdBy = createdByUser;
      }

      const newFine = this.repository.create(fineData);
      const savedFine = await this.repository.save(newFine) as any;

      res.status(201).json({
        status: "success",
        data: this.format(savedFine),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const fine = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["member", "groupMember", "group", "contribution", "loan"],
      });

      if (!fine) {
        return next(new NotFoundError("Fine not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(fine),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const {
        memberId,
        groupMemberId,
        groupId,
        contributionId,
        loanId,
        reason,
        amount,
      } = req.body;

      let fine = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["member", "groupMember", "group", "contribution", "loan"],
      });

      if (!fine) {
        return next(new NotFoundError("Fine not found"));
      }

      // Update related entities if provided
      if (memberId) {
        const member = await AppDataSource.getRepository(Member).findOne({
          where: { id: memberId },
        });
        if (!member) {
          return next(new NotFoundError("Member not found"));
        }
        fine.member = member;
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
        fine.groupMember = groupMember;
      }

      if (groupId) {
        const group = await AppDataSource.getRepository(Group).findOne({
          where: { id: groupId },
        });
        if (!group) {
          return next(new NotFoundError("Group not found"));
        }
        fine.group = group;
      }

      if (contributionId) {
        const contribution = await AppDataSource.getRepository(
          Contribution
        ).findOne({
          where: { id: contributionId },
        });
        if (!contribution) {
          return next(new NotFoundError("Contribution not found"));
        }
        fine.contribution = contribution;
      }

      if (loanId) {
        const loan = await AppDataSource.getRepository(Loan).findOne({
          where: { id: loanId },
        });
        if (!loan) {
          return next(new NotFoundError("Loan not found"));
        }
        fine.loan = loan;
      }

      // Update other fields if provided
      if (reason !== undefined) fine.reason = reason;
      if (amount !== undefined) fine.amount = amount;

      const updatedFine = await this.repository.save(fine);

      res.status(200).json({
        status: "success",
        data: this.format(updatedFine),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Only join member, group, and createdBy for list view (avoid deep joins for speed)
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [],
        ["fines.member", "fines.group", "fines.createdBy"],
        []
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

      const fine = await this.repository.findOne({
        where: { id: Number(recordId) },
      });

      if (!fine) {
        return next(new NotFoundError("Fine not found"));
      }

      await this.repository.remove(fine);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
