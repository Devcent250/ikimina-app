import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Season } from "../entities/Season";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError } from "../errors/http.errors";
import { QueryParams } from "../types/QueryParams";

export class SeasonController {
  private repository: Repository<Season> = AppDataSource.getRepository(Season);
  private queryBuilder: QueryBuilder<Season>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "seasons",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name", "description"],
      allowedSortFields: [
        "createdAt",
        "updatedAt",
        "name",
        "start",
        "end",
        "year",
      ],
      filterableFields: ["status"],
    });
  }

  private format = (season: Season) => {
    return {
      ...season,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, description, start, end, year, status } = req.body;

      // Check if season with same name exists
      const existingSeason = await this.repository.findOne({
        where: { name },
      });

      if (existingSeason) {
        return next(new Error("Season with this name already exists"));
      }

      // Validate dates
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (startDate >= endDate) {
        return next(new Error("Start date must be before end date"));
      }

      // Create new season
      const newSeason = this.repository.create({
        name,
        description,
        start: startDate,
        end: endDate,
        status,
      });

      const savedSeason = await this.repository.save(newSeason);

      res.status(201).json({
        status: "success",
        data: this.format(savedSeason),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const season = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["contributions", "loans", "expenses", "loanPayments"],
      });

      if (!season) {
        return next(new NotFoundError("Season not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(season),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const { name, description, start, end, year, status } = req.body;

      let season = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["contributions", "loans", "expenses", "loanPayments"],
      });

      if (!season) {
        return next(new NotFoundError("Season not found"));
      }

      // Check if new name conflicts with existing season
      if (name && name !== season.name) {
        const existingSeason = await this.repository.findOne({
          where: { name },
        });

        if (existingSeason) {
          return next(new Error("Season with this name already exists"));
        }
      }

      // Validate dates if provided
      if (start || end) {
        const startDate = start ? new Date(start) : season.start;
        const endDate = end ? new Date(end) : season.end;

        if (startDate >= endDate) {
          return next(new Error("Start date must be before end date"));
        }
      }

      // Update fields if provided
      if (name !== undefined) season.name = name;
      if (description !== undefined) season.description = description;
      if (start !== undefined) season.start = new Date(start);
      if (end !== undefined) season.end = new Date(end);
      if (status !== undefined) season.status = status;

      const updatedSeason = await this.repository.save(season);

      res.status(200).json({
        status: "success",
        data: this.format(updatedSeason),
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

      const season = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["contributions", "loans", "expenses", "loanPayments"],
      });

      if (!season) {
        return next(new NotFoundError("Season not found"));
      }

      // Check if season has associated records
      if (
        (season.contributions && season.contributions.length > 0) ||
        (season.loans && season.loans.length > 0) ||
        (season.expenses && season.expenses.length > 0) ||
        (season.loanPayments && season.loanPayments.length > 0)
      ) {
        return next(new Error("Cannot delete season with associated records"));
      }

      await this.repository.remove(season);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
