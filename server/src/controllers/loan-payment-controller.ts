import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { LoanPayment } from "../entities/LoanPayment";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError } from "../errors/http.errors";
import { Loan } from "../entities/Loan";
import { PaymentMethod } from "../entities/PaymentMethod";
import { User } from "../entities/User";
import { Group } from "../entities/Group";
import { Season } from "../entities/Season";

export class LoanPaymentController {
  private repository: Repository<LoanPayment> =
    AppDataSource.getRepository(LoanPayment);
  private queryBuilder: QueryBuilder<LoanPayment>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "loan_payments",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["referenceNumber"],
      allowedSortFields: ["createdAt", "updatedAt", "amount", "date"],
      filterableFields: [
        "loan",
        "paymentMethod",
        "receivedBy",
        "group",
        "season",
      ],
    });
  }

  private format = (payment: LoanPayment) => {
    return {
      ...payment,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      console.log("=== LOAN PAYMENT CREATION START ===");
      console.log("Creating loan payment with body:", req.body);
      console.log("Loan ID from params:", req.params.loanId);
      console.log("Request headers:", req.headers);
      console.log("User from request:", req.user);

      const {
        paymentMethodId,
        amount,
        notes,
        referenceNumber,
      } = req.body;

      // Extract loanId from URL params
      const loanId = Number(req.params.loanId);

      // Validate required fields
      console.log("Validating fields...");
      console.log("Amount:", amount, "Type:", typeof amount);
      console.log("PaymentMethodId:", paymentMethodId, "Type:", typeof paymentMethodId);

      if (!amount || amount <= 0) {
        console.log("Amount validation failed");
        return next(new Error("Amount must be a positive number"));
      }

      if (!paymentMethodId) {
        console.log("Payment method validation failed");
        return next(new Error("Payment method is required"));
      }

      console.log("Field validation passed");

      // Fetch related entities
      const loan = await AppDataSource.getRepository(Loan).findOne({
        where: { id: loanId },
        relations: ["groupMember", "groupMember.group", "season", "group", "branch"],
      });
      console.log("Found loan:", loan?.id);
      console.log("Loan groupMember:", loan?.groupMember);
      console.log("Loan groupMember.group:", loan?.groupMember?.group);
      console.log("Loan direct group:", loan?.group);
      console.log("Loan season:", loan?.season);

      if (!loan) {
        return next(new NotFoundError("Loan not found"));
      }

      const paymentMethod = await AppDataSource.getRepository(
        PaymentMethod
      ).findOne({
        where: { id: paymentMethodId },
      });
      if (!paymentMethod) {
        return next(new NotFoundError("Payment method not found"));
      }

      // Get current user from request (assuming it's set by auth middleware)
      const receivedBy = req.user;
      console.log("🔍 JWT User payload:", JSON.stringify(receivedBy, null, 2));

      if (!receivedBy) {
        return next(new NotFoundError("User not authenticated"));
      }

      // Get user ID from JWT payload
      const userId = receivedBy.id || receivedBy.userId;
      console.log("🔍 Extracted user ID:", userId, "Type:", typeof userId);

      if (!userId) {
        return next(new NotFoundError("User ID not found in token"));
      }

      // Fetch the actual user entity
      console.log("🔍 Searching for user with ID:", userId);
      let user = await AppDataSource.getRepository(User).findOne({
        where: { id: userId },
      });

      if (!user) {
        console.log("❌ No user found with ID:", userId);
        console.log("🔍 Trying to find user by email as fallback...");

        // Try to find user by email as fallback
        if (receivedBy.email) {
          user = await AppDataSource.getRepository(User).findOne({
            where: { email: receivedBy.email },
          });

          if (user) {
            console.log("✅ Found user by email:", user.name, "ID:", user.id);
            console.log("⚠️  JWT token has outdated user ID. Consider refreshing token.");
          }
        }

        if (!user) {
          console.log("❌ No user found with ID or email");
          console.log("🔍 Available users in database:");
          const allUsers = await AppDataSource.getRepository(User).find({ select: ["id", "name", "email"] });
          console.log("Users:", allUsers.map(u => ({ id: u.id, name: u.name, email: u.email })));
          return next(new NotFoundError(`User not found with ID: ${userId} or email: ${receivedBy.email}`));
        }
      } else {
        console.log("✅ Found user by ID:", user.name, "ID:", user.id);
      }

      // Get group from the loan - try multiple sources
      let group = loan.groupMember?.group || loan.group;
      if (!group) {
        console.log("No group found in loan relationships, trying to find group from loan data...");

        // Try to find group by looking up the loan's branch and finding any group
        if (loan.branch) {
          const fallbackGroup = await AppDataSource.getRepository(Group).findOne({
            where: { branch: { id: loan.branch.id } },
            order: { createdAt: "DESC" },
          });
          if (fallbackGroup) {
            group = fallbackGroup;
            console.log("Using fallback group:", fallbackGroup.id);
          }
        }

        if (!group) {
          return next(new NotFoundError("Loan group not found and no fallback available"));
        }
      }

      // Get season from the loan or use fallback
      let season = loan.season;
      if (!season) {
        console.log("No season found in loan, trying to get active season...");
        // Try to get the current active season as fallback
        const activeSeason = await AppDataSource.getRepository(Season).findOne({
          where: { status: "active" },
          order: { createdAt: "DESC" },
        });
        if (!activeSeason) {
          return next(new NotFoundError("No active season found"));
        }
        season = activeSeason;
        console.log("Using fallback season:", activeSeason.id);
      }

      // Create new payment
      const newPayment = this.repository.create({
        loan,
        paymentMethod,
        receivedBy: user,
        group,
        season,
        amount,
        date: new Date(), // Use current date
        referenceNumber: referenceNumber || notes, // Use notes as reference if no reference number
      });

      const savedPayment = await this.repository.save(newPayment);
      console.log("Payment created successfully:", savedPayment.id);
      console.log("=== LOAN PAYMENT CREATION END ===");

      res.status(201).json({
        status: "success",
        data: this.format(savedPayment),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const payment = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["loan", "paymentMethod", "receivedBy", "group", "season"],
      });

      if (!payment) {
        return next(new NotFoundError("Loan payment not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(payment),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const {
        loanId,
        paymentMethodId,
        receivedById,
        groupId,
        seasonId,
        amount,
        date,
        referenceNumber,
      } = req.body;

      let payment = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["loan", "paymentMethod", "receivedBy", "group", "season"],
      });

      if (!payment) {
        return next(new NotFoundError("Loan payment not found"));
      }

      // Update related entities if provided
      if (loanId) {
        const loan = await AppDataSource.getRepository(Loan).findOne({
          where: { id: loanId },
        });
        if (!loan) {
          return next(new NotFoundError("Loan not found"));
        }
        payment.loan = loan;
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
        payment.paymentMethod = paymentMethod;
      }

      if (receivedById) {
        const receivedBy = await AppDataSource.getRepository(User).findOne({
          where: { id: receivedById },
        });
        if (!receivedBy) {
          return next(new NotFoundError("User not found"));
        }
        payment.receivedBy = receivedBy;
      }

      if (groupId) {
        const group = await AppDataSource.getRepository(Group).findOne({
          where: { id: groupId },
        });
        if (!group) {
          return next(new NotFoundError("Group not found"));
        }
        payment.group = group;
      }

      if (seasonId) {
        const season = await AppDataSource.getRepository(Season).findOne({
          where: { id: seasonId },
        });
        if (!season) {
          return next(new NotFoundError("Season not found"));
        }
        payment.season = season;
      }

      // Update other fields if provided
      if (amount !== undefined) payment.amount = amount;
      if (date !== undefined) payment.date = date;
      if (referenceNumber !== undefined)
        payment.referenceNumber = referenceNumber;

      const updatedPayment = await this.repository.save(payment);

      res.status(200).json({
        status: "success",
        data: this.format(updatedPayment),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this.queryBuilder.buildAndExecute(req.query);

      res.status(200).json({
        status: "success",
        data: result.results.map(this.format),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
        },
      });
    }
  );

  delete = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const payment = await this.repository.findOne({
        where: { id: Number(recordId) },
      });

      if (!payment) {
        return next(new NotFoundError("Loan payment not found"));
      }

      await this.repository.remove(payment);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}