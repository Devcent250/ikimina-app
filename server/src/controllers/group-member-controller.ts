import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { GroupMember } from "../entities/GroupMember";
import { Group } from "../entities/Group";
import { Member } from "../entities/Member";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import {
  NotFoundError,
  BadRequestError,
  ValidationError,
} from "../errors/http.errors";
import { QueryParams } from "../types/QueryParams";

export class GroupMemberController {
  private repository: Repository<GroupMember> =
    AppDataSource.getRepository(GroupMember);
  private groupRepository: Repository<Group> =
    AppDataSource.getRepository(Group);
  private memberRepository: Repository<Member> =
    AppDataSource.getRepository(Member);
  private queryBuilder: QueryBuilder<GroupMember>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "groupMembers",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: [],
      allowedSortFields: ["createdAt", "updatedAt", "numberOfShares"],
      filterableFields: ["group", "member", "branch", "loanEligibility"],
    });
  }

  private format = (groupMember: GroupMember) => {
    return {
      ...groupMember,
      loanEligibility: groupMember.loanEligibility, // ensure this is always present
    };
  };

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Check for group parameter
      if (req.params.groupId) {
        req.body.group = req.params.groupId;
      }

      // Validate group exists
      const group = await this.groupRepository.findOne({
        where: { id: req.body.group },
      });

      if (!group) {
        return next(new NotFoundError("Group not found"));
      }

      // Validate member exists
      const member = await this.memberRepository.findOne({
        where: { id: req.body.member },
      });

      if (!member) {
        return next(new NotFoundError("Member not found"));
      }

      // Check if member is already in this group
      const existingMembership = await this.repository.findOne({
        where: {
          group: { id: req.body.group },
          member: { id: req.body.member },
        },
      });

      if (existingMembership) {
        return next(new BadRequestError("Member is already in this group"));
      }

      // Validate shares against group min/max
      if (req.body.numberOfShares < group.minShares) {
        return next(
          new BadRequestError(
            `Number of shares must be at least ${group.minShares}`
          )
        );
      }

      if (req.body.numberOfShares > group.maxShares) {
        return next(
          new BadRequestError(
            `Number of shares cannot exceed ${group.maxShares}`
          )
        );
      }

      // Set branch from group's branch
      req.body.branch = group.branch;

      const newGroupMember = this.repository.create(req.body);
      const [savedGroupMember] = await this.repository.save(newGroupMember);

      res.status(201).json({
        status: "success",
        data: this.format(savedGroupMember),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const groupMember = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["group", "member",],
      });

      if (!groupMember) {
        return next(new NotFoundError("Group membership not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(groupMember),
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      let groupMember = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["group", "branch"],
      });

      if (!groupMember) {
        return next(new NotFoundError("Group membership not found"));
      }

      // Validate shares against group min/max if changing
      if (req.body.numberOfShares !== undefined) {
        if (req.body.numberOfShares < groupMember.group.minShares) {
          return next(
            new BadRequestError(
              `Number of shares must be at least ${groupMember.group.minShares}`
            )
          );
        }

        if (req.body.numberOfShares > groupMember.group.maxShares) {
          return next(
            new BadRequestError(
              `Number of shares cannot exceed ${groupMember.group.maxShares}`
            )
          );
        }
      }

      // Don't allow changing group or member
      delete req.body.group;
      delete req.body.member;
      delete req.body.branch;

      // Update the group member
      this.repository.merge(groupMember, req.body);
      const updatedGroupMember = await this.repository.save(groupMember);

      res.status(200).json({
        status: "success",
        data: this.format(updatedGroupMember),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const groupId = req.params.groupId;
      const result = await this?.queryBuilder.buildAndExecute(
        req.query as QueryParams,
        [
          {
            where: `"groupMembers"."groupId" = :groupId`,
            parameters: { groupId: groupId },
          },
        ],
        ["groupMembers.member", "groupMembers.group", "groupMembers.branch"]
      );
      console.log("results==", {
        ...result,
        results: result.results.map(this.format),
      });
      res.json({
        ...result,
        results: result.results.map(this.format),
      });
    }
  );

  delete = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const groupMember = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["contributions", "loans", "branch"],
      });

      if (!groupMember) {
        return next(new NotFoundError("Group membership not found"));
      }

      // Check if group member has related data to prevent cascading deletion
      if (groupMember.contributions?.length || groupMember.loans?.length) {
        return next(
          new BadRequestError(
            "Cannot delete group membership with contributions or loans"
          )
        );
      }

      await this.repository.remove(groupMember);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}
