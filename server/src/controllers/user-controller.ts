import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { User } from "../entities/User";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { BadRequestError, NotFoundError } from "../errors/http.errors";
import * as bcrypt from "bcryptjs";
import { QueryParams } from "../types/QueryParams";
import { Group } from "../entities/Group";
import { Branch } from "../entities/Branch";

export class UserController {
  private repository: Repository<User> = AppDataSource.getRepository(User);
  private groupRepository: Repository<Group> = AppDataSource.getRepository(Group); 
  private branchRepository: Repository<Branch> = AppDataSource.getRepository(Branch);
  private queryBuilder: QueryBuilder<User>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "users",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["username", "names", "email"],
      allowedSortFields: ["createdAt", "updatedAt", "username"],
      filterableFields: ["role", "branch","group"],
    });
  }

  private format = (user: User) => {
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Hash password before storing

      const branch = await this.branchRepository.findOne({
        where: { id: Number(req.body.branchId) }
      });
      
      if (!branch) {
        return next(new BadRequestError("Branch not found"));
      }

      const group = await this.groupRepository.findOne({
        where: { id: Number(req.body.groupId), branch: { id: branch.id } },
        relations: ["branch"]
      });
      
      if (!group) {
        return next(new BadRequestError("Group not found or does not belong to the specified branch"));
      }

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      }

      const newUser = this.repository.create({
        ...req.body,
        role: req.body.role ? { id: req.body.role } : undefined,
        branch: { id: branch.id },
        group: { id: group.id }
      });
      const savedUser:any = await this.repository.save(newUser);


      const userWithRelations = await this.repository.findOne({
        where: { id: savedUser.id },
        relations: ["role", "branch", "group"]
      });
      console.log()

      res.status(201).json({
        status: "success",
        data: userWithRelations,
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const user = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["role", "branch","group"],
      });

      if (!user) {
        return next(new NotFoundError("User not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(user),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      // Don't allow password updates through this endpoint for security
      if (req.body.password) {
        delete req.body.password;
      }

      let user = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations:["role","branch","group"]
      });

      if (!user) {
        return next(new NotFoundError("User not found"));
      }

      if (req.body.branchId) {
        const branch = await this.branchRepository.findOne({
          where: { id: Number(req.body.branchId) }
        });
        
        if (!branch) {
          return next(new BadRequestError("Branch not found"));
        }
      }

      if (req.body.groupId) {
        const branchId = req.body.branchId || (user.branch ? user.branch.id : null);
        
        if (!branchId) {
          return next(new BadRequestError("Branch must be specified when updating group"));
        }
        
        const group = await this.groupRepository.findOne({
          where: { 
            id: Number(req.body.groupId), 
            branch: { id: branchId } 
          },
          relations: ["branch"]
        });
        
        if (!group) {
          return next(new BadRequestError("Group not found or does not belong to the specified branch"));
        }
      }
      // Update the user
      this.repository.merge(user, {
        ...req.body,
        role: req.body.roleId ? { id: req.body.roleId } : user.role,
        branch: req.body.branchId ? { id: req.body.branchId } : user.branch,
        group: req.body.groupId ? { id: req.body.groupId } : user.group
      });
      const updatedUser = await this.repository.save(user);

      const refreshedUser = await this.repository.findOne({
        where: { id: updatedUser.id },
        relations: ["role", "branch", "group"]
      });

      res.status(200).json({
        status: "success",
        data: this.format(refreshedUser),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [],
        ["users.role","users.branch","users.group"]
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

      const user = await this.repository.findOne({
        where: { id: Number(recordId) },
      });

      if (!user) {
        return next(new NotFoundError("User not found"));
      }

      // check is not deleting self
      if (req.user?.id === user.id) {
        return next(new Error("You cannot delete yourself"));
      }

      await this.repository.remove(user);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
