import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { PaymentMethod } from "../entities/PaymentMethod";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError } from "../errors/http.errors";
import { QueryParams } from "../types/QueryParams";

export class PaymentMethodController {
  private repository: Repository<PaymentMethod> =
    AppDataSource.getRepository(PaymentMethod);
  private queryBuilder: QueryBuilder<PaymentMethod>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "payment_methods",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name", "accountNumber"],
      allowedSortFields: ["createdAt", "updatedAt", "name"],
      filterableFields: [],
    });
  }

  private format = (paymentMethod: PaymentMethod) => {
    return {
      ...paymentMethod,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, description, accountNumber } = req.body;

      // Check if payment method with same name exists
      const existingPaymentMethod = await this.repository.findOne({
        where: { name },
      });

      if (existingPaymentMethod) {
        return next(new Error("Payment method with this name already exists"));
      }

      // Create new payment method
      const newPaymentMethod = this.repository.create({
        name,
        description,
        accountNumber,
      });

      const savedPaymentMethod = await this.repository.save(newPaymentMethod);

      res.status(201).json({
        status: "success",
        data: this.format(savedPaymentMethod),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const paymentMethod = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["contributions", "loanPayments", "expenses"],
      });

      if (!paymentMethod) {
        return next(new NotFoundError("Payment method not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(paymentMethod),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const { name, description, accountNumber } = req.body;

      let paymentMethod = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["contributions", "loanPayments", "expenses"],
      });

      if (!paymentMethod) {
        return next(new NotFoundError("Payment method not found"));
      }

      // Check if new name conflicts with existing payment method
      if (name && name !== paymentMethod.name) {
        const existingPaymentMethod = await this.repository.findOne({
          where: { name },
        });

        if (existingPaymentMethod) {
          return next(
            new Error("Payment method with this name already exists")
          );
        }
      }

      // Update fields if provided
      if (name !== undefined) paymentMethod.name = name;
      if (description !== undefined) paymentMethod.description = description;
      if (accountNumber !== undefined)
        paymentMethod.accountNumber = accountNumber;

      const updatedPaymentMethod = await this.repository.save(paymentMethod);

      res.status(200).json({
        status: "success",
        data: this.format(updatedPaymentMethod),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
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

      const paymentMethod = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["contributions", "loanPayments", "expenses"],
      });

      if (!paymentMethod) {
        return next(new NotFoundError("Payment method not found"));
      }

      // Check if payment method has associated records
      if (
        (paymentMethod.contributions &&
          paymentMethod.contributions.length > 0) ||
        (paymentMethod.loanPayments && paymentMethod.loanPayments.length > 0) ||
        (paymentMethod.expenses && paymentMethod.expenses.length > 0)
      ) {
        return next(
          new Error("Cannot delete payment method with associated records")
        );
      }

      await this.repository.remove(paymentMethod);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
