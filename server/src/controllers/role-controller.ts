import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Role } from "../entities/Role";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError } from "../errors/http.errors";
import { QueryParams } from "../types/QueryParams";

export class RoleController {
  private repository: Repository<Role> = AppDataSource.getRepository(Role);
  private queryBuilder: QueryBuilder<Role>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "roles",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name"],
      allowedSortFields: ["createdAt", "updatedAt", "name"],
      filterableFields: [],
    });
  }

  private format = (role: Role) => {
    return {
      ...role,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, permissions } = req.body;

      // Check if role with same name exists
      const existingRole = await this.repository.findOne({
        where: { name },
      });

      if (existingRole) {
        return next(new Error("Role with this name already exists"));
      }

      // Create new role
      const newRole = this.repository.create({
        name,
        permissions,
      });

      const savedRole = await this.repository.save(newRole);

      res.status(201).json({
        status: "success",
        data: this.format(savedRole),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const role = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["users"],
      });

      if (!role) {
        return next(new NotFoundError("Role not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(role),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const { name, permissions } = req.body;

      let role = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["users"],
      });

      if (!role) {
        return next(new NotFoundError("Role not found"));
      }

      // Check if new name conflicts with existing role
      if (name && name !== role.name) {
        const existingRole = await this.repository.findOne({
          where: { name },
        });

        if (existingRole) {
          return next(new Error("Role with this name already exists"));
        }
      }

      // Update fields if provided
      if (name !== undefined) role.name = name;
      if (permissions !== undefined) role.permissions = permissions;

      const updatedRole = await this.repository.save(role);

      res.status(200).json({
        status: "success",
        data: this.format(updatedRole),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [],
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

      const role = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["users"],
      });

      if (!role) {
        return next(new NotFoundError("Role not found"));
      }

      // Check if role has associated users
      if (role.users && role.users.length > 0) {
        return next(new Error("Cannot delete role with associated users"));
      }

      await this.repository.remove(role);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
