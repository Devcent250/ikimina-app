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
import { Contribution } from "../entities/Contribution";
import { LoanCategory } from "../entities/LoanCategory";

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

      // Calculate member's total contributions (deposit + solidarity amounts)
      const contributionRepository = AppDataSource.getRepository(Contribution);
      const memberContributions = await contributionRepository
        .createQueryBuilder("contribution")
        .where("contribution.groupMember = :groupMemberId", { groupMemberId })
        .andWhere("contribution.season = :seasonId", { seasonId })
        .getMany();

      // Calculate total contributions (current saving amount from latest contribution)
      let totalContributions = 0;
      if (memberContributions.length > 0) {
        // Get the latest contribution to get the current total
        const latestContribution = await contributionRepository
          .createQueryBuilder("contribution")
          .where("contribution.groupMember = :groupMemberId", { groupMemberId })
          .andWhere("contribution.season = :seasonId", { seasonId })
          .orderBy("contribution.createdAt", "DESC")
          .getOne();

        if (latestContribution) {
          // Total contributions = current saving amount + current solidarity amount
          totalContributions = latestContribution.currentSavingAmount + latestContribution.currentSolidalityAmount;
        }
      }

      // Maximum loan amount = 3 times total contributions
      const maxLoanAmount = totalContributions * 3;

      // Get loan category limits if loanType is provided
      let categoryMaxAmount = null;
      let categoryMinAmount = null;
      if (loanType) {
        const loanCategory = await AppDataSource.getRepository(LoanCategory).findOne({
          where: { name: loanType, isActive: true }
        });

        if (loanCategory) {
          categoryMaxAmount = loanCategory.maxAmount;
          categoryMinAmount = loanCategory.minAmount;
        }
      }

      // Determine the effective maximum amount (most restrictive)
      let effectiveMaxAmount = maxLoanAmount;
      if (categoryMaxAmount && categoryMaxAmount > 0) {
        effectiveMaxAmount = Math.min(maxLoanAmount, categoryMaxAmount);
      }

      // Check if requested amount exceeds effective maximum
      if (amount > effectiveMaxAmount) {
        let errorMessage = `Loan amount (${amount.toLocaleString()} FRW) exceeds maximum allowed amount (${effectiveMaxAmount.toLocaleString()} FRW).`;

        if (categoryMaxAmount && categoryMaxAmount < maxLoanAmount) {
          errorMessage += ` Limited by loan category maximum (${categoryMaxAmount.toLocaleString()} FRW).`;
        } else {
          errorMessage += ` Maximum loan is 3 times your total contributions (${totalContributions.toLocaleString()} FRW).`;
        }

        return next(new BadRequestError(errorMessage));
      }

      // Check if requested amount is below category minimum
      if (categoryMinAmount && amount < categoryMinAmount) {
        return next(new BadRequestError(
          `Loan amount (${amount.toLocaleString()} FRW) is below minimum required for this loan category (${categoryMinAmount.toLocaleString()} FRW).`
        ));
      }

      // Check for existing unpaid loans
      const existingLoans = await this.repository
        .createQueryBuilder("loan")
        .leftJoin("loan.payments", "payment")
        .where("loan.groupMember = :groupMemberId", { groupMemberId })
        .andWhere("loan.season = :seasonId", { seasonId })
        .groupBy("loan.id")
        .having("loan.amount > COALESCE(SUM(payment.amount), 0)")
        .getMany();

      if (existingLoans.length > 0) {
        return next(new BadRequestError("Member has existing unpaid loans. Please clear previous loans before applying for a new one."));
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

      // Get approval counts
      const approvals = loan.verifications?.filter(v => v.status === "Approved") || [];
      const rejections = loan.verifications?.filter(v => v.status === "Rejected") || [];

      const approvalStatus = {
        loan: this.format(loan),
        approvals: approvals.length,
        rejections: rejections.length,
        totalLeaders: 3,
        neededApprovals: 3,
        canApprove: loan.status === "pending",
        currentUserApproved: approvals.some(v => v.member?.id === req.user?.id),
        currentUserRejected: rejections.some(v => v.member?.id === req.user?.id),
        currentUserCanApprove: loan.status === "pending" &&
          !approvals.some(v => v.member?.id === req.user?.id) &&
          !rejections.some(v => v.member?.id === req.user?.id)
      };

      res.status(200).json({
        status: "success",
        data: approvalStatus
      });
    }
  );

  // Get maximum loan amount for a member based on contributions
  getMaxLoanAmount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { groupMemberId, seasonId } = req.params;
      const { loanType } = req.query; // Optional loan type to check category limits

      // Validate group member exists
      const groupMember = await AppDataSource.getRepository(GroupMember).findOne({
        where: { id: Number(groupMemberId) },
        relations: ["member"]
      });

      if (!groupMember) {
        return next(new NotFoundError("Group member not found"));
      }

      // Validate season exists
      const season = await AppDataSource.getRepository(Season).findOne({
        where: { id: Number(seasonId) }
      });

      if (!season) {
        return next(new NotFoundError("Season not found"));
      }

      // Calculate member's total contributions
      const contributionRepository = AppDataSource.getRepository(Contribution);

      // Get the latest contribution to get current totals
      const latestContribution = await contributionRepository
        .createQueryBuilder("contribution")
        .where("contribution.groupMember = :groupMemberId", { groupMemberId: Number(groupMemberId) })
        .andWhere("contribution.season = :seasonId", { seasonId: Number(seasonId) })
        .orderBy("contribution.createdAt", "DESC")
        .getOne();

      let totalContributions = 0;
      if (latestContribution) {
        // Total contributions = current saving amount + current solidarity amount
        totalContributions = latestContribution.currentSavingAmount + latestContribution.currentSolidalityAmount;
      }

      // Maximum loan amount based on contributions = 3 times total contributions
      const contributionBasedMaxAmount = totalContributions * 3;

      // Get loan category limits if loanType is provided
      let categoryMaxAmount = null;
      let categoryMinAmount = null;
      let categoryInfo = null;

      if (loanType) {
        const loanCategory = await AppDataSource.getRepository(LoanCategory).findOne({
          where: { name: loanType as string, isActive: true }
        });

        if (loanCategory) {
          categoryMaxAmount = loanCategory.maxAmount;
          categoryMinAmount = loanCategory.minAmount;
          categoryInfo = {
            name: loanCategory.name,
            maxAmount: categoryMaxAmount,
            minAmount: categoryMinAmount,
            defaultAmount: loanCategory.defaultAmount,
            interestRate: loanCategory.interestRate
          };
        }
      }

      // Determine the effective maximum amount (most restrictive)
      let effectiveMaxAmount = contributionBasedMaxAmount;
      let limitedBy = "contributions";

      if (categoryMaxAmount && categoryMaxAmount > 0 && categoryMaxAmount < contributionBasedMaxAmount) {
        effectiveMaxAmount = categoryMaxAmount;
        limitedBy = "category";
      }

      // Check for existing unpaid loans
      const existingLoans = await this.repository
        .createQueryBuilder("loan")
        .leftJoin("loan.payments", "payment")
        .where("loan.groupMember = :groupMemberId", { groupMemberId: Number(groupMemberId) })
        .andWhere("loan.season = :seasonId", { seasonId: Number(seasonId) })
        .groupBy("loan.id")
        .having("loan.amount > COALESCE(SUM(payment.amount), 0)")
        .getMany();

      const hasUnpaidLoans = existingLoans.length > 0;

      // Generate appropriate message
      let message = "";
      if (hasUnpaidLoans) {
        message = "Member has existing unpaid loans";
      } else if (totalContributions === 0) {
        message = "Member has no contributions yet";
      } else if (limitedBy === "category") {
        message = `Member can borrow up to ${effectiveMaxAmount.toLocaleString()} FRW (limited by loan category: ${categoryInfo?.name})`;
      } else {
        message = `Member can borrow up to ${effectiveMaxAmount.toLocaleString()} FRW (3x contributions)`;
      }

      res.status(200).json({
        status: "success",
        data: {
          groupMember: {
            id: groupMember.id,
            member: {
              id: groupMember.member.id,
              fullNames: groupMember.member.fullNames
            }
          },
          totalContributions,
          contributionBasedMaxAmount,
          effectiveMaxAmount,
          limitedBy,
          categoryInfo,
          hasUnpaidLoans,
          loanEligible: groupMember.loanEligibility && !hasUnpaidLoans && totalContributions > 0,
          message
        }
      });
    }
  );
}