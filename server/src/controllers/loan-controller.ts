import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Loan } from "../entities/Loan";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError, BadRequestError } from "../errors/http.errors";
import { GroupMember } from "../entities/GroupMember";
import { Member } from "../entities/Member";
import { Season } from "../entities/Season";
import { User } from "../entities/User";
import { Group } from "../entities/Group";
import { QueryParams } from "../types/QueryParams";
import { Branch } from "../entities/Branch";

export class LoanController {
  private repository: Repository<Loan> = AppDataSource.getRepository(Loan);
  private queryBuilder: QueryBuilder<Loan>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "loans",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: [],
      allowedSortFields: ["createdAt", "updatedAt", "amount", "loanType"],
      filterableFields: [
        "groupMember",
        "member",
        "season",
        "group",
        "createdBy",
        "loanType",
      ],
    });
  }

  private format = (loan: Loan) => {
    return {
      ...loan,
      totalPaid:
        loan?.payments?.reduce(
          (acc, payment) => acc + (payment?.amount || 0),
          0
        ) || 0,
      dueAmount:
        loan.amount -
        (loan?.payments?.reduce(
          (acc, payment) => acc + (payment.amount || 0),
          0
        ) || 0),
      progressPercent:
        (loan?.payments?.reduce(
          (acc, payment) => acc + (payment.amount || 0),
          0
        ) /
          loan.amount) *
        100,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        groupMemberId,
        seasonId,
        groupId,
        createdById,
        amount,
        loanType,
        loanTerms,
        interestRate,
        paymentFrequency,
        attachments,
        branchId,
      } = req.body;

      const branch = await AppDataSource.getRepository(Branch).findOne({
        where: { id: branchId },
      });

      if (!branch) {
        return next(new NotFoundError("Branch not found"));
      }

      // Fetch related entities
      const groupMember = await AppDataSource.getRepository(
        GroupMember
      ).findOne({
        where: { id: groupMemberId },
        relations: ["member"],
      });

      if (!groupMember) {
        return next(new NotFoundError("Group member not found"));
      }

      // Check loan eligibility
      if (!groupMember.loanEligibility) {
        return next(new BadRequestError("Member is not eligible for loans"));
      }

      const season = await AppDataSource.getRepository(Season).findOne({
        where: { id: seasonId },
      });

      if (!season) {
        return next(new NotFoundError("Season not found"));
      }

      const group = await AppDataSource.getRepository(Group).findOne({
        where: { id: groupId },
      });
      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      const createdBy = await AppDataSource.getRepository(User).findOne({
        where: { id: createdById },
      });
      if (!createdBy) {
        return next(new NotFoundError("User not found"));
      }

      // Create new loan
      const newLoan = this.repository.create({
        groupMember,
        member: groupMember.member,
        season,
        group,
        createdBy,
        amount,
        loanType,
        loanTerms,
        interestRate,
        paymentFrequency,
        attachments,
        branch: branch,
      });

      const savedLoan = await this.repository.save(newLoan);

      res.status(201).json({
        status: "success",
        data: this.format(savedLoan),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const loan = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "groupMember",
          "member",
          "season",
          "group",
          "createdBy",
          "verifications",
          "payments",
          "fines",
        ],
      });

      if (!loan) {
        return next(new NotFoundError("Loan not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(loan),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const {
        groupMemberId,
        memberId,
        seasonId,
        groupId,
        createdById,
        amount,
        loanType,
        loanTerms,
        interestRate,
        paymentFrequency,
        attachments,
        completedAt,
      } = req.body;

      let loan = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "groupMember",
          "member",
          "season",
          "group",
          "createdBy",
          "verifications",
          "payments",
          "fines",
        ],
      });

      if (!loan) {
        return next(new NotFoundError("Loan not found"));
      }

      // Update related entities if provided
      if (groupMemberId) {
        const groupMember = await AppDataSource.getRepository(
          GroupMember
        ).findOne({
          where: { id: groupMemberId },
        });
        if (!groupMember) {
          return next(new NotFoundError("Group member not found"));
        }
        if (!groupMember.loanEligibility) {
          return next(new BadRequestError("Member is not eligible for loans"));
        }
        loan.groupMember = groupMember;
      }

      if (memberId) {
        const member = await AppDataSource.getRepository(Member).findOne({
          where: { id: memberId },
        });
        if (!member) {
          return next(new NotFoundError("Member not found"));
        }
        loan.member = member;
      }

      if (seasonId) {
        const season = await AppDataSource.getRepository(Season).findOne({
          where: { id: seasonId },
        });
        if (!season) {
          return next(new NotFoundError("Season not found"));
        }
        loan.season = season;
      }

      if (groupId) {
        const group = await AppDataSource.getRepository(Group).findOne({
          where: { id: groupId },
        });
        if (!group) {
          return next(new NotFoundError("Group not found"));
        }
        loan.group = group;
      }

      if (createdById) {
        const createdBy = await AppDataSource.getRepository(User).findOne({
          where: { id: createdById },
        });
        if (!createdBy) {
          return next(new NotFoundError("User not found"));
        }
        loan.createdBy = createdBy;
      }

      // Update other fields if provided
      if (amount !== undefined) loan.amount = amount;
      if (loanType !== undefined) loan.loanType = loanType;
      if (loanTerms !== undefined) loan.loanTerms = loanTerms;
      if (interestRate !== undefined) loan.interestRate = interestRate;
      if (paymentFrequency !== undefined)
        loan.paymentFrequency = paymentFrequency;
      if (attachments !== undefined) loan.attachments = attachments;
      if (completedAt !== undefined) loan.completedAt = completedAt;

      const updatedLoan = await this.repository.save(loan);

      res.status(200).json({
        status: "success",
        data: this.format(updatedLoan),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [],
        [
          "loans.member",
          "loans.groupMember",
          "loans.group",
          "loans.createdBy",
          "loans.payments",
          "loans.branch",
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

      const loan = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["payments", "fines"],
      });

      if (!loan) {
        return next(new NotFoundError("Loan not found"));
      }

      // Check if loan has related payments or fines
      if (loan.payments?.length || loan.fines?.length) {
        return next(
          new BadRequestError(
            "Cannot delete loan with associated payments or fines"
          )
        );
      }

      await this.repository.remove(loan);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
