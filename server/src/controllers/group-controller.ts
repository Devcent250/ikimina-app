import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Group } from "../entities/Group";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError } from "../errors/http.errors";
import { Member } from "../entities/Member";
import { Branch } from "../entities/Branch";
import { QueryParams } from "../types/QueryParams";
import { User } from "../entities/User";

export class GroupController {
  private repository: Repository<Group> = AppDataSource.getRepository(Group);
  private memberRepository: Repository<Member> =
    AppDataSource.getRepository(Member);
  private branchRepository: Repository<Branch> =
    AppDataSource.getRepository(Branch);
  private userRepository: Repository<User> = AppDataSource.getRepository(User);
  private queryBuilder: QueryBuilder<Group>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "groups",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name", "description", "location"],
      allowedSortFields: [
        "createdAt",
        "updatedAt",
        "name",
        "pricePerShare",
        "savingAmount",
      ],
      filterableFields: ["meetingFrequency", "branchId"],
    });
  }

  private format = (group: Group) => {
    return {
      ...group,
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        name,
        description,
        presidentId,
        accountantId,
        secretaryId,
        meetingFrequency,
        location,
        pricePerShare,
        minShares,
        maxShares,
        branchId,
        solidarityAmount,
      } = req.body;

      // Check if group with same name exists
      const existingGroup = await this.repository.findOne({
        where: { name },
      });

      if (existingGroup) {
        return next(new Error("Group with this name already exists"));
      }

      // Validate branch
      const branch = await this.branchRepository.findOne({
        where: { id: branchId },
      });

      if (!branch) {
        return next(new NotFoundError("Branch not found"));
      }

      // Validate officers if provided
      let president: Member | null = null;
      let accountant: Member | null = null;
      let secretary: Member | null = null;

      if (presidentId) {
        president = await this.memberRepository.findOne({
          where: { id: presidentId },
        });
        if (!president) {
          return next(new NotFoundError("President member not found"));
        }
      }

      if (accountantId) {
        accountant = await this.memberRepository.findOne({
          where: { id: accountantId },
        });
        if (!accountant) {
          return next(new NotFoundError("Accountant member not found"));
        }
      }

      if (secretaryId) {
        secretary = await this.memberRepository.findOne({
          where: { id: secretaryId },
        });
        if (!secretary) {
          return next(new NotFoundError("Secretary member not found"));
        }
      }

      // Validate share limits
      if (minShares > maxShares) {
        return next(
          new Error("Minimum shares cannot be greater than maximum shares")
        );
      }

      console.log(
        {
          name,
          description,
          president,
          accountant,
          secretary,
          meetingFrequency,
          location,
          pricePerShare,
          minShares,
          maxShares,
          branch,
          solidarityAmount,
        },
        req.body
      );

      // Create new group
      const newGroup = this.repository.create({
        name,
        description,
        president,
        accountant,
        secretary,
        meetingFrequency,
        location,
        pricePerShare,
        minShares,
        maxShares,
        branch,
        solidarityAmount,
      });

      const savedGroup = await this.repository.save(newGroup);

      res.status(201).json({
        status: "success",
        data: this.format(savedGroup),
      });
    }
  );

  getMyGroup = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      console.log("user==",req.user)
      if (!req.user || !req.user.id) {
        return next(new Error("Authentication required"));
      }

      // Find the user with their group
      const user = await this.userRepository.findOne({
        where: { id: req.user.id },
        relations: ["group"]
      });

      if (!user || !user.group) {
        return res.status(200).json({
          status: "success",
          data: null,
          message: "You are not assigned to any group"
        });
      }

      // Get the complete group information
      const group = await this.repository.findOne({
        where: { id: user.group.id },
        relations: [
          "president",
          "accountant",
          "secretary",
          "branch",
          "groupMembers",
          "groupMembers.member",
        ],
      });

      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(group),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const group = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "president",
          "accountant",
          "secretary",
          "branch",
          "groupMembers",
          "groupMembers.member",
          "contributions",
          "loans",
          "fines",
          "attendances",
          "expenses",
        ],
      });

      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(group),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const {
        name,
        description,
        presidentId,
        accountantId,
        secretaryId,
        meetingFrequency,
        location,
        pricePerShare,
        minShares,
        maxShares,
        branchId,
        solidarityAmount,
      } = req.body;

      let group = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "president",
          "accountant",
          "secretary",
          "branch",
          "groupMembers",
          "contributions",
          "loans",
          "fines",
          "attendances",
          "expenses",
        ],
      });

      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      // Check if new name conflicts with existing group
      if (name && name !== group.name) {
        const existingGroup = await this.repository.findOne({
          where: { name },
        });

        if (existingGroup) {
          return next(new Error("Group with this name already exists"));
        }
      }

      // Validate branch if provided
      if (branchId) {
        const branch = await this.branchRepository.findOne({
          where: { id: branchId },
        });

        if (!branch) {
          return next(new NotFoundError("Branch not found"));
        }
        group.branch = branch;
      }

      // Validate officers if provided
      if (presidentId) {
        const president = await this.memberRepository.findOne({
          where: { id: presidentId },
        });
        if (!president) {
          return next(new NotFoundError("President member not found"));
        }
        group.president = president;
      }

      if (accountantId) {
        const accountant = await this.memberRepository.findOne({
          where: { id: accountantId },
        });
        if (!accountant) {
          return next(new NotFoundError("Accountant member not found"));
        }
        group.accountant = accountant;
      }

      if (secretaryId) {
        const secretary = await this.memberRepository.findOne({
          where: { id: secretaryId },
        });
        if (!secretary) {
          return next(new NotFoundError("Secretary member not found"));
        }
        group.secretary = secretary;
      }

      // Validate share limits if provided
      if (minShares !== undefined && maxShares !== undefined) {
        if (minShares > maxShares) {
          return next(
            new Error("Minimum shares cannot be greater than maximum shares")
          );
        }
      }

      // Update fields if provided
      if (name !== undefined) group.name = name;
      if (description !== undefined) group.description = description;
      if (meetingFrequency !== undefined)
        group.meetingFrequency = meetingFrequency;
      if (location !== undefined) group.location = location;
      if (pricePerShare !== undefined) group.pricePerShare = pricePerShare;
      if (minShares !== undefined) group.minShares = minShares;
      if (maxShares !== undefined) group.maxShares = maxShares;
      if (solidarityAmount !== undefined)
        group.solidarityAmount = solidarityAmount;

      const updatedGroup = await this.repository.save(group);

      res.status(200).json({
        status: "success",
        data: this.format(updatedGroup),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [],
        [
          "groups.branch",
          "groups.groupMembers",
          "groups.president",
          "groups.accountant",
          "groups.secretary",
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

      const group = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "groupMembers",
          "contributions",
          "loans",
          "fines",
          "attendances",
          "expenses",
        ],
      });

      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      // Check if group has associated records
      if (
        (group.groupMembers && group.groupMembers.length > 0) ||
        (group.contributions && group.contributions.length > 0) ||
        (group.loans && group.loans.length > 0) ||
        (group.fines && group.fines.length > 0) ||
        (group.attendances && group.attendances.length > 0) ||
        (group.expenses && group.expenses.length > 0)
      ) {
        return next(new Error("Cannot delete group with associated records"));
      }

      await this.repository.remove(group);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
