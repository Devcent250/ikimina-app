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

      // Fetch related entities
      const loan = await AppDataSource.getRepository(Loan).findOne({
        where: { id: loanId },
      });
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

      const receivedBy = await AppDataSource.getRepository(User).findOne({
        where: { id: receivedById },
      });
      if (!receivedBy) {
        return next(new NotFoundError("User not found"));
      }

      const group = await AppDataSource.getRepository(Group).findOne({
        where: { id: groupId },
      });
      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      const season = await AppDataSource.getRepository(Season).findOne({
        where: { id: seasonId },
      });
      if (!season) {
        return next(new NotFoundError("Season not found"));
      }

      // Create new payment
      const newPayment = this.repository.create({
        loan,
        paymentMethod,
        receivedBy,
        group,
        season,
        amount,
        date,
        referenceNumber,
      });

      const savedPayment = await this.repository.save(newPayment);

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