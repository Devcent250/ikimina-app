import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Attendance } from "../entities/Attendance";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import {
  NotFoundError,
  BadRequestError,
  ValidationError,
} from "../errors/http.errors";

export class AttendanceController {
  private repository: Repository<Attendance> =
    AppDataSource.getRepository(Attendance);

  private queryBuilder: QueryBuilder<Attendance>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "brands",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name", "description"],
      allowedSortFields: ["createdAt", "updatedAt"],
      filterableFields: ["isActive"],
    });
  }

  private format = (brand: Attendance) => {
    return {
      ...brand,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
  delete = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
}
