import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Expense } from "../entities/Expense";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError } from "../errors/http.errors";
import { Group } from "../entities/Group";
import { Season } from "../entities/Season";
import { User } from "../entities/User";
import { ExpenseCategory } from "../entities/ExpenseCategory";
import { PaymentMethod } from "../entities/PaymentMethod";
import { QueryParams } from "../types/QueryParams";
import { Branch } from "../entities/Branch";

export class ExpenseController {
  private repository: Repository<Expense> =
    AppDataSource.getRepository(Expense);
  private queryBuilder: QueryBuilder<Expense>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "expenses",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name"],
      allowedSortFields: ["createdAt", "updatedAt", "amount", "name"],
      filterableFields: [
        "group",
        "season",
        "expenseCategory",
        "paymentMethod",
        "createdBy",
      ],
    });
  }

  private format = (expense: Expense) => {
    return {
      ...expense,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        groupId,
        expenseCategoryId,
        paymentMethodId,
        amount,
        name,
        attachment,
        branchId,
        notes,
      } = req.body;

      // Fetch related entities
      const group = await AppDataSource.getRepository(Group).findOne({
        where: { id: groupId },
      });

      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      const expenseCategory = await AppDataSource.getRepository(
        ExpenseCategory
      ).findOne({
        where: { id: expenseCategoryId },
      });

      if (!expenseCategory) {
        return next(new NotFoundError("Expense category not found"));
      }

      const paymentMethod = await AppDataSource.getRepository(
        PaymentMethod
      ).findOne({
        where: { id: paymentMethodId },
      });
      if (!paymentMethod) {
        return next(new NotFoundError("Payment method not found"));
      }

      const currentSeason = await AppDataSource.getRepository(Season).findOne({
        where: { status: "active" },
      });

      if (!currentSeason) {
        return next(new NotFoundError("There is no active season"));
      }

      const branch = await AppDataSource.getRepository(Branch).findOne({
        where: { id: branchId },
      });

      if (!branch) {
        return next(new NotFoundError("Branch not found"));
      }

      // Create new expense
      const newExpense = this.repository.create({
        group,
        season: currentSeason,
        expenseCategory,
        paymentMethod,
        createdBy: { id: req?.user?.id },
        amount,
        name,
        attachment,
        branch,
        notes,
      });

      const savedExpense = await this.repository.save(newExpense);

      res.status(201).json({
        status: "success",
        data: this.format(savedExpense),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const expense = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "group",
          "season",
          "expenseCategory",
          "paymentMethod",
          "createdBy",
        ],
      });

      if (!expense) {
        return next(new NotFoundError("Expense not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(expense),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const {
        groupId,
        seasonId,
        expenseCategoryId,
        paymentMethodId,
        createdById,
        amount,
        name,
        attachment,
        notes,
      } = req.body;

      let expense = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "group",
          "season",
          "expenseCategory",
          "paymentMethod",
          "createdBy",
        ],
      });

      if (!expense) {
        return next(new NotFoundError("Expense not found"));
      }

      // Update related entities if provided
      if (groupId) {
        const group = await AppDataSource.getRepository(Group).findOne({
          where: { id: groupId },
        });
        if (!group) {
          return next(new NotFoundError("Group not found"));
        }
        expense.group = group;
      }

      if (seasonId) {
        const season = await AppDataSource.getRepository(Season).findOne({
          where: { id: seasonId },
        });
        if (!season) {
          return next(new NotFoundError("Season not found"));
        }
        expense.season = season;
      }

      if (expenseCategoryId) {
        const expenseCategory = await AppDataSource.getRepository(
          ExpenseCategory
        ).findOne({
          where: { id: expenseCategoryId },
        });
        if (!expenseCategory) {
          return next(new NotFoundError("Expense category not found"));
        }
        expense.expenseCategory = expenseCategory;
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
        expense.paymentMethod = paymentMethod;
      }

      if (createdById) {
        const createdBy = await AppDataSource.getRepository(User).findOne({
          where: { id: createdById },
        });
        if (!createdBy) {
          return next(new NotFoundError("User not found"));
        }
        expense.createdBy = createdBy;
      }

      // Update other fields if provided
      if (amount !== undefined) expense.amount = amount;
      if (name !== undefined) expense.name = name;
      if (attachment !== undefined) expense.attachment = attachment;
      if (notes !== undefined) expense.notes = notes;

      const updatedExpense = await this.repository.save(expense);

      res.status(200).json({
        status: "success",
        data: this.format(updatedExpense),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [],
        [
          "expenses.group",
          "expenses.season",
          "expenses.expenseCategory",
          "expenses.paymentMethod",
          "expenses.createdBy",
          "expenses.createdBy.group",
          "expenses.branch",
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

      const expense = await this.repository.findOne({
        where: { id: Number(recordId) },
      });

      if (!expense) {
        return next(new NotFoundError("Expense not found"));
      }

      await this.repository.remove(expense);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
