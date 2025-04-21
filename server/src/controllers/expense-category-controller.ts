import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { ExpenseCategory } from "../entities/ExpenseCategory";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError, BadRequestError } from "../errors/http.errors";
import { QueryParams } from "../types/QueryParams";

export class ExpenseCategoryController {
  private repository: Repository<ExpenseCategory> =
    AppDataSource.getRepository(ExpenseCategory);
  private queryBuilder: QueryBuilder<ExpenseCategory>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "expense_categories",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name", "description"],
      allowedSortFields: ["createdAt", "updatedAt", "name"],
      filterableFields: [],
    });
  }

  private format = (category: ExpenseCategory) => {
    return {
      ...category,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Check if category with same name already exists
      const existingCategory = await this.repository.findOne({
        where: { name: req.body.name },
      });

      if (existingCategory) {
        return next(
          new BadRequestError("Category with this name already exists")
        );
      }

      const newCategory = this.repository.create(req.body);
      const savedCategory = await this.repository.save(newCategory);

      res.status(201).json({
        status: "success",
        data: this.format(savedCategory[0]),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const category = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["expenses"],
      });

      if (!category) {
        return next(new NotFoundError("Category not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(category),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      let category = await this.repository.findOne({
        where: { id: Number(recordId) },
      });

      if (!category) {
        return next(new NotFoundError("Category not found"));
      }

      // If changing name, check for uniqueness
      if (req.body.name && req.body.name !== category.name) {
        const existingCategory = await this.repository.findOne({
          where: { name: req.body.name },
        });

        if (existingCategory) {
          return next(
            new BadRequestError("Category with this name already exists")
          );
        }
      }

      // Update the category
      this.repository.merge(category, req.body);
      const updatedCategory = await this.repository.save(category);

      res.status(200).json({
        status: "success",
        data: this.format(updatedCategory),
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

      const category = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["expenses"],
      });

      if (!category) {
        return next(new NotFoundError("Category not found"));
      }

      // Check if category has related expenses
      if (category.expenses?.length) {
        return next(
          new BadRequestError("Cannot delete category with associated expenses")
        );
      }

      await this.repository.remove(category);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
