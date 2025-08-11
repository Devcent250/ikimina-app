import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Expense } from "../entities/Expense";
import { Group } from "../entities/Group";
import { User } from "../entities/User";
import { Loan } from "../entities/Loan";
import { Branch } from "../entities/Branch";
import { Season } from "../entities/Season";
import { Contribution } from "../entities/Contribution";
import { LoanPayment } from "../entities/LoanPayment";
import { GroupMember } from "../entities/GroupMember";

export class DashboardController {
  private userRepository: Repository<User> = AppDataSource.getRepository(User);
  private loanRepository: Repository<Loan> = AppDataSource.getRepository(Loan);
  private loanPaymentRepository: Repository<LoanPayment> =
    AppDataSource.getRepository(LoanPayment);
  private groupRepository: Repository<Group> =
    AppDataSource.getRepository(Group);
  private branchRepository: Repository<Branch> =
    AppDataSource.getRepository(Branch);
  private seasonRepository: Repository<Season> =
    AppDataSource.getRepository(Season);
  private contributionRepository: Repository<Contribution> =
    AppDataSource.getRepository(Contribution);

  getDashboardData = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Total Savings Across All Groups
        const totalSavings = await this.contributionRepository
          .createQueryBuilder("contributions")
          .select("SUM(contributions.depositAmount)", "total")
          .getRawOne();

        // Active Members
        const activeMembers = await this.userRepository
          .createQueryBuilder("users")
          .where("users.status = :status", { status: "active" })
          .getCount();

        // Active Loans count
        const activeLoans = await this.loanRepository
          .createQueryBuilder("loans")
          .where("loans.status = :status", { status: "approved" })
          .getCount();

        // Total Groups
        const totalGroups = await this.groupRepository
          .createQueryBuilder("groups")
          .getCount();

        // Branches Count
        const branchesCount = await this.branchRepository
          .createQueryBuilder("branches")
          .getCount();

        // Current season savings
        const currentSeason = await this.seasonRepository
          .createQueryBuilder("seasons")
          .where("seasons.status = :status", { status: "active" })
          .getOne();

        const currentSeasonSavings = currentSeason
          ? await this.contributionRepository
            .createQueryBuilder("contributions")
            .where("contributions.seasonId = :seasonId", {
              seasonId: currentSeason.id,
            })
            .select("SUM(contributions.depositAmount)", "total")
            .getRawOne()
          : { total: 0 };

        // Loans Balance calculated by subtracting total repaid from total loan amount
        const totalLoanAmount = await this.loanRepository
          .createQueryBuilder("loans")
          .select("SUM(loans.amount)", "total")
          .getRawOne();

        const totalRepaidAmount = await this.loanPaymentRepository
          .createQueryBuilder("loansPayments")
          .select("SUM(loansPayments.amount)", "total")
          .getRawOne();

        const loansBalance =
          Number(totalLoanAmount?.total || 0) -
          Number(totalRepaidAmount?.total || 0);

        // Repayment Rate
        const repaymentRate =
          totalLoanAmount.total > 0
            ? (totalRepaidAmount.total / totalLoanAmount.total) * 100
            : 0;

        res.status(200).json({
          status: "success",
          data: {
            totalSavings: Number(totalSavings.total),
            activeMembers,
            activeLoans,
            totalGroups,
            branchesCount,
            currentSeasonSavings: Number(currentSeasonSavings.total),
            loansBalance,
            repaymentRate,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  getCurrentMonthContributions = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const currentSeason = await this.seasonRepository
          .createQueryBuilder("seasons")
          .where("seasons.status = :status", { status: "active" })
          .getOne();

        const currentMonthContributions = await this.contributionRepository
          .createQueryBuilder("contributions")
          .where("contributions.seasonId = :seasonId", {
            seasonId: currentSeason?.id,
          })
          .select("SUM(contributions.depositAmount)", "total")
          .getRawOne();

        res.status(200).json({
          status: "success",
          data: {
            total: Number(currentMonthContributions?.total || 0),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  getSavingsByGroup = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const currentSeason = await this.seasonRepository
        .createQueryBuilder("seasons")
        .where("seasons.status = :status", { status: "active" })
        .getOne();
      // Correct calculation: sum contributions per group, get member count separately
      const groupSavings = await AppDataSource.getRepository(Contribution)
        .createQueryBuilder("contributions")
        .leftJoin("contributions.group", "group")
        .leftJoin("group.branch", "branch")
        .where("contributions.seasonId = :seasonId", { seasonId: currentSeason?.id })
        .select([
          `group.id as "groupId"`,
          `group.name as "groupName"`,
          `branch.id as "branchId"`,
          `branch.name as "branchName"`,
          `SUM(contributions.depositAmount) as "totalSavings"`,
          `COUNT(DISTINCT contributions.id) as "contributionCount"`
        ])
        .groupBy("group.id, group.name, branch.id, branch.name")
        .getRawMany();

      // Get member count separately
      const memberCounts = await AppDataSource.getRepository(GroupMember)
        .createQueryBuilder("members")
        .leftJoin("members.group", "group")
        .select([
          `group.id as "groupId"`,
          `COUNT(members.id) as "totalMembers"`
        ])
        .groupBy("group.id")
        .getRawMany();

      // Merge member count into groupSavings
      const savingsWithMembers = groupSavings.map(gs => {
        const member = memberCounts.find(mc => mc.groupId === gs.groupId);
        return {
          ...gs,
          totalMembers: member ? member.totalMembers : 0
        };
      });

      res.status(200).json({
        status: "success",
        data: savingsWithMembers,
      });
    }
  );

  getLoansDistributionsPerGroup = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const loansDistributions = await this.groupRepository
        .createQueryBuilder("groups")
        .leftJoin("groups.loans", "loans")
        .leftJoin("groups.branch", "branch")
        .where("loans.status = :status", { status: "approved" })
        .select([
          `groups.id as "groupId"`,
          `groups.name as "groupName"`,
          `branch.id as "branchId"`,
          `branch.name as "branchName"`,
          `SUM(loans.amount) as "totalLoans"`,
          `COUNT(DISTINCT loans.id) as "loanCount"`,
        ])
        .groupBy("groups.id, groups.name, branch.id, branch.name")
        .getRawMany();

      // Filter out groups with zero loans
      const filteredData = loansDistributions.filter(
        (e) => Number(e.totalLoans) > 0
      );

      // Calculate the grand total of all loans
      const grandTotal = filteredData.reduce(
        (sum, group) => sum + Number(group.totalLoans),
        0
      );

      // Add percentage to each group
      const result = filteredData.map((group) => ({
        ...group,
        percentage:
          grandTotal > 0 ? (Number(group.totalLoans) / grandTotal) * 100 : 0,
      }));

      res.status(200).json({
        status: "success",
        data: result,
      });
    }
  );

  getLoanReports = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log("Fetching loan reports...");

        // Total Loans
        const totalLoans = await this.loanRepository
          .createQueryBuilder("loans")
          .getCount();

        console.log("Total loans:", totalLoans);

        // Active Loans (approved status)
        const activeLoans = await this.loanRepository
          .createQueryBuilder("loans")
          .where("loans.status = :status", { status: "approved" })
          .getCount();

        console.log("Active loans:", activeLoans);

        // Pending Approval Loans
        const pendingLoans = await this.loanRepository
          .createQueryBuilder("loans")
          .where("loans.status = :status", { status: "pending" })
          .getCount();

        console.log("Pending loans:", pendingLoans);

        // Total Loan Amount
        const totalLoanAmount = await this.loanRepository
          .createQueryBuilder("loans")
          .select("SUM(loans.amount)", "total")
          .getRawOne();

        console.log("Total loan amount:", totalLoanAmount);

        // Total Repaid Amount
        const totalRepaidAmount = await this.loanPaymentRepository
          .createQueryBuilder("loanPayments")
          .select("SUM(loanPayments.amount)", "total")
          .getRawOne();

        console.log("Total repaid amount:", totalRepaidAmount);

        // Recent Loan Activity (last 10 loans)
        const recentLoans = await this.loanRepository
          .createQueryBuilder("loans")
          .leftJoin("loans.member", "member")
          .select([
            "loans.id",
            "loans.amount",
            "loans.status",
            "loans.loanType",
            "loans.createdAt",
            "member.firstName",
            "member.lastName"
          ])
          .orderBy("loans.createdAt", "DESC")
          .limit(10)
          .getMany();

        console.log("Recent loans count:", recentLoans.length);

        // Calculate percentage changes (simplified - you can enhance this with actual month-over-month data)
        const activePercentage = totalLoans > 0 ? (activeLoans / totalLoans) * 100 : 0;
        const pendingPercentage = totalLoans > 0 ? (pendingLoans / totalLoans) * 100 : 0;

        const responseData = {
          totalLoans,
          activeLoans,
          pendingLoans,
          totalAmount: Number(totalLoanAmount?.total || 0),
          totalRepaid: Number(totalRepaidAmount?.total || 0),
          activePercentage: Math.round(activePercentage),
          pendingPercentage: Math.round(pendingPercentage),
          recentLoans: recentLoans.map(loan => ({
            id: loan.id,
            memberName: `${loan.member?.firstName || ''} ${loan.member?.lastName || ''}`.trim(),
            loanType: loan.loanType,
            amount: loan.amount,
            status: loan.status,
            createdAt: loan.createdAt
          }))
        };

        console.log("Response data:", responseData);

        res.status(200).json({
          status: "success",
          data: responseData,
        });
      } catch (error) {
        console.error("Error in getLoanReports:", error);
        next(error);
      }
    }
  );

  // Test endpoint to check if loans table has data
  testLoansData = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log("Testing loans data...");

        // Check if we can connect to the loans table
        const allLoans = await this.loanRepository.find();
        console.log("All loans found:", allLoans.length);

        // Get a sample loan
        const sampleLoan = await this.loanRepository.findOne({
          relations: ["member"]
        });

        res.status(200).json({
          status: "success",
          data: {
            totalLoans: allLoans.length,
            sampleLoan: sampleLoan ? {
              id: sampleLoan.id,
              amount: sampleLoan.amount,
              status: sampleLoan.status,
              memberName: sampleLoan.member ? `${sampleLoan.member.firstName} ${sampleLoan.member.lastName}` : 'No member'
            } : null
          },
        });
      } catch (error) {
        console.error("Error in testLoansData:", error);
        next(error);
      }
    }
  );
}
