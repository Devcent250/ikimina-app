import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Branch } from "../entities/Branch";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError, BadRequestError } from "../errors/http.errors";
import { QueryParams } from "../types/QueryParams";
import { District } from "../entities/District";

export class BranchController {
  private repository: Repository<Branch> = AppDataSource.getRepository(Branch);
  private queryBuilder: QueryBuilder<Branch>;
  private districtRepository: Repository<District> = AppDataSource.getRepository(District);

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "branches",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name", "address", "description"],
      allowedSortFields: ["createdAt", "updatedAt", "name"],
      filterableFields: ["district"],
    });
  }

  private format = (branch: Branch) => {
    return {
      ...branch,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Check if branch with same name already exists
      const existingBranch = await this.repository.findOne({
        where: { name: req.body.name },
      });

      if (existingBranch) {
        return next(
          new BadRequestError("Branch with this name already exists")
        );
      }

      // Validate district
      const district = await this.districtRepository.findOne({
        where: { id: req.body.districtId },
      });

      if (!district) {
        return next(new NotFoundError("District not found"));
      }

      const newBranch = this.repository.create({
        ...req.body,
        district,
      });
      const savedBranch = await this.repository.save(newBranch);

      res.status(201).json({
        status: "success",
        data: savedBranch,
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const branch = await this.repository.findOne({
        where: { id: Number(recordId) },
      });

      if (!branch) {
        return next(new NotFoundError("Branch not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(branch),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      let branch = await this.repository.findOne({
        where: { id: Number(recordId) },
      });

      if (!branch) {
        return next(new NotFoundError("Branch not found"));
      }

      // If changing name, check for uniqueness
      if (req.body.name && req.body.name !== branch.name) {
        const existingBranch = await this.repository.findOne({
          where: { name: req.body.name },
        });

        if (existingBranch) {
          return next(
            new BadRequestError("Branch with this name already exists")
          );
        }
      }

      // Update the branch
      this.repository.merge(branch, req.body);
      const updatedBranch = await this.repository.save(branch);

      res.status(200).json({
        status: "success",
        data: this.format(updatedBranch),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [],
        ["branches.members", "branches.groups"]
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

      const branch = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["users", "groups", "members"],
      });

      if (!branch) {
        return next(new NotFoundError("Branch not found"));
      }

      // Check if branch has related data to prevent cascading deletion
      if (
        branch.users?.length ||
        branch.groups?.length ||
        branch.members?.length
      ) {
        return next(
          new BadRequestError(
            "Cannot delete branch with associated users, groups, or members"
          )
        );
      }

      await this.repository.remove(branch);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
