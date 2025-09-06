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
import { LoanVerification } from "../entities/LoanVerification";

export class LoanController {
  // Endpoint: GET /group-members/:groupMemberId/allowed-loan-amount
  getAllowedLoanAmount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { groupMemberId } = req.params;
      const groupMember = await AppDataSource.getRepository("GroupMember").findOne({
        where: { id: Number(groupMemberId) },
        relations: ["member"]
      });
      if (!groupMember) {
        return next(new NotFoundError("Group member not found"));
      }
      const totalContribution = await AppDataSource.getRepository("Contribution")
        .createQueryBuilder("contribution")
        .where("contribution.member.id = :memberId", { memberId: groupMember.member.id })
        .select("SUM(contribution.depositAmount + contribution.solidarityAmount)", "total")
        .getRawOne();
      const allowedLoanAmount = (Number(totalContribution?.total) || 0) * 3;
      res.json({ allowedLoanAmount });
    }
  );
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

      // Check if the group member is a leader (president, accountant, or secretary)
      const isLeader =
        groupMember.member.id === group.president?.id ||
        groupMember.member.id === group.accountant?.id ||
        groupMember.member.id === group.secretary?.id;

      let createdBy = null;
      if (isLeader && createdById) {
        createdBy = await AppDataSource.getRepository(User).findOne({
          where: { id: createdById },
        });
        if (!createdBy) {
          return next(new NotFoundError("User not found"));
        }
      }
      // For regular members, createdBy can be null (no user account needed)

      // Create new loan
      // Calculate total contribution for the member
      const totalContribution = await AppDataSource.getRepository("Contribution")
        .createQueryBuilder("contribution")
        .where("contribution.member.id = :memberId", { memberId: groupMember.member.id })
        .select("SUM(contribution.depositAmount + contribution.solidarityAmount)", "total")
        .getRawOne();

      const allowedLoanAmount = (Number(totalContribution?.total) || 0) * 3;

      // If requested amount exceeds allowed, reject
      if (amount > allowedLoanAmount) {
        return next(new BadRequestError(`Requested loan amount exceeds allowed limit. Max allowed: ${allowedLoanAmount}`));
      }

      const newLoan = this.repository.create({
        groupMember,
        member: groupMember.member,
        season,
        group,
        ...(createdBy && { createdBy }), // Only include createdBy if it exists
        amount,
        loanType,
        loanTerms,
        interestRate,
        paymentFrequency,
        attachments,
        branch: branch,
        allowedLoanAmount,
      });

      const savedLoan = await this.repository.save(newLoan);

      res.status(201).json({
        status: "success",
        data: this.format(savedLoan),
        allowedLoanAmount,
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
      const user = req.user;

      // Check user permissions and filter data accordingly
      if (user.isAdmin) {
        // Admin can see all loans - proceed with normal query
        try {
          console.log("Request query:", req.query);

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
              "loans.verifications",
            ]
          );

          console.log("Query result:", result);

          res.json({
            ...result,
            results: result.results.map(this.format),
          });
        } catch (error) {
          console.error("Error in getAll loans:", error);
          next(error);
        }
      } else if (user.role?.name === "President" || user.role?.name === "Accountant" || user.role?.name === "Secretary") {
        // Group leaders can only see loans from their groups
        const { Group } = await import("../entities/Group");
        const groupRepository = AppDataSource.getRepository(Group);

        // Find groups where the user is a leader
        let userGroups = [];

        if (user.role?.name === "President") {
          const presidentGroups = await groupRepository.find({
            where: { president: { id: user.id } },
            select: ["id"]
          });
          userGroups = presidentGroups;
        } else if (user.role?.name === "Accountant") {
          const accountantGroups = await groupRepository.find({
            where: { accountant: { id: user.id } },
            select: ["id"]
          });
          userGroups = accountantGroups;
        } else if (user.role?.name === "Secretary") {
          const secretaryGroups = await groupRepository.find({
            where: { secretary: { id: user.id } },
            select: ["id"]
          });
          userGroups = secretaryGroups;
        }

        if (userGroups.length === 0) {
          // User is a leader but has no groups, return empty result
          res.json({
            results: [],
            pagination: {
              page: 1,
              limit: 25,
              total: 0,
              totalPages: 0
            }
          });
          return;
        }

        const groupIds = userGroups.map(g => g.id);

        // Get loans from user's groups
        const loans = await this.repository
          .createQueryBuilder("loan")
          .leftJoinAndSelect("loan.member", "member")
          .leftJoinAndSelect("loan.groupMember", "groupMember")
          .leftJoinAndSelect("loan.group", "group")
          .leftJoinAndSelect("loan.createdBy", "createdBy")
          .leftJoinAndSelect("loan.payments", "payments")
          .leftJoinAndSelect("loan.branch", "branch")
          .leftJoinAndSelect("loan.verifications", "verifications")
          .where("loan.group.id IN (:...groupIds)", { groupIds })
          .orderBy("loan.createdAt", "DESC")
          .getMany();

        const formattedResults = loans.map(this.format);

        res.json({
          results: formattedResults,
          pagination: {
            page: 1,
            limit: loans.length,
            total: loans.length,
            totalPages: 1
          }
        });
      } else {
        // Regular members can only see their own loans
        const loans = await this.repository
          .createQueryBuilder("loan")
          .leftJoinAndSelect("loan.member", "member")
          .leftJoinAndSelect("loan.groupMember", "groupMember")
          .leftJoinAndSelect("loan.group", "group")
          .leftJoinAndSelect("loan.createdBy", "createdBy")
          .leftJoinAndSelect("loan.payments", "payments")
          .leftJoinAndSelect("loan.branch", "branch")
          .leftJoinAndSelect("loan.verifications", "verifications")
          .where("loan.member.id = :memberId", { memberId: user.id })
          .orderBy("loan.createdAt", "DESC")
          .getMany();

        const formattedResults = loans.map(this.format);

        res.json({
          results: formattedResults,
          pagination: {
            page: 1,
            limit: loans.length,
            total: loans.length,
            totalPages: 1
          }
        });
      }
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

  // Approve or reject a loan by a leader
  approveLoan = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const { status, notes } = req.body; // status: "Approved" or "Rejected"
      const currentUser = req.user;

      // Find the loan
      const loan = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["group", "group.president", "group.accountant", "group.secretary", "verifications"],
      });

      if (!loan) {
        return next(new NotFoundError("Loan not found"));
      }

      // Check if loan is already approved or rejected
      if (loan.status !== "pending") {
        return next(new BadRequestError("Loan is already processed"));
      }

      // Verify that the current user is a leader of this loan's group
      const isApprover =
        (loan.group.president?.id === currentUser.id) ||
        (loan.group.secretary?.id === currentUser.id);

      if (!isApprover) {
        return next(new BadRequestError("Only the President or Secretary can approve loans"));
      }

      // Check if this leader has already approved/rejected this loan
      const existingVerification = await AppDataSource.getRepository(LoanVerification).findOne({
        where: {
          loan: { id: loan.id },
          member: { id: currentUser.id }
        }
      });

      if (existingVerification) {
        return next(new BadRequestError("You have already processed this loan"));
      }

      // Create verification record
      const verification = new LoanVerification();
      verification.loan = loan;
      verification.member = await AppDataSource.getRepository(Member).findOne({
        where: { id: currentUser.id }
      });
      verification.status = status;
      verification.notes = notes;

      await AppDataSource.getRepository(LoanVerification).save(verification);

      // Check if we have 3 approvals
      const approvals = await AppDataSource.getRepository(LoanVerification).find({
        where: {
          loan: { id: loan.id },
          status: "Approved"
        }
      });

      const rejections = await AppDataSource.getRepository(LoanVerification).find({
        where: {
          loan: { id: loan.id },
          status: "Rejected"
        }
      });

      // If we have 3 approvals, automatically approve the loan
      if (approvals.length >= 2) {
        loan.status = "approved";
        await this.repository.save(loan);
      }
      // If we have any rejections, automatically reject the loan
      else if (rejections.length > 0) {
        loan.status = "rejected";
        await this.repository.save(loan);
      }

      // Return updated loan with verification info
      const updatedLoan = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["verifications", "verifications.member", "group", "group.president", "group.accountant", "group.secretary"],
      });

      res.status(200).json({
        status: "success",
        data: this.format(updatedLoan),
        message: `Loan ${status.toLowerCase()} successfully`
      });
    }
  );

  // Get loan approval status
  getLoanApprovalStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const loan = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "verifications",
          "verifications.member",
          "group",
          "group.president",
          "group.accountant",
          "group.secretary"
        ],
      });

      if (!loan) {
        return next(new NotFoundError("Loan not found"));
      }

      // Removed loan eligibility logic
      res.status(200).json({
        status: "success",
        data: this.format(loan)
      });
    }
  );
}