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
      const groupSavings = await this.groupRepository
        .createQueryBuilder("groups")
        .leftJoin("groups.contributions", "contributions")
        .leftJoin("groups.branch", "branch")
        .leftJoin("groups.groupMembers", "members") // Add this join for members
        .where("contributions.seasonId = :seasonId", {
          seasonId: currentSeason?.id,
        })
        .select([
          `groups.id as "groupId"`,
          `groups.name as "groupName"`,
          `branch.id as "branchId"`,
          `branch.name as "branchName"`,
          `AVG(contributions.depositAmount) as "averageSavings"`,
          `SUM(contributions.depositAmount) as "totalSavings"`,
          `COUNT(DISTINCT contributions.id) as "contributionCount"`,
          `COUNT(DISTINCT members.id) as "totalMembers"`, // Count distinct members
        ])
        .groupBy("groups.id, groups.name, branch.id, branch.name")
        .getRawMany();

      res.status(200).json({
        status: "success",
        data: groupSavings,
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
}
