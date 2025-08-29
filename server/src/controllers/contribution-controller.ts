import { NextFunction, Request, Response } from "express";
import { RequestHandler } from "express-serve-static-core";
import { asyncHandler } from "../utils/async-handler";
import { Contribution } from "../entities/Contribution";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError, BadRequestError } from "../errors/http.errors";
import { Member } from "../entities/Member";
import { GroupMember } from "../entities/GroupMember";
import { Season } from "../entities/Season";
import { Group } from "../entities/Group";
import { PaymentMethod } from "../entities/PaymentMethod";
import { User } from "../entities/User";
import { QueryParams } from "../types/QueryParams";
import { Branch } from "../entities/Branch";

export class ContributionController {
  private repository: Repository<Contribution> =
    AppDataSource.getRepository(Contribution);
  private queryBuilder: QueryBuilder<Contribution>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "contributions",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      // Don't use dot notation in searchableFields
      searchableFields: [], // We'll handle search separately
      allowedSortFields: ["createdAt", "updatedAt", "depositAmount"],
      filterableFields: [
        "member", // Keep this simple without dot notation
        "group",
        "paymentMethod",
        "receivedBy",
        "date",
      ],
      nestedJoins: [
        {
          path: "contributions.member",
          alias: "member"
        },
        {
          path: "contributions.group",
          alias: "group"
        },
        {
          path: "contributions.paymentMethod",
          alias: "paymentMethod"
        },
        {
          path: "contributions.receivedBy",
          alias: "receivedBy"
        }
      ]
    });
  }

  private format = (contribution: Contribution) => {
    return {
      ...contribution,
    };
  };

  create = asyncHandler(
    async (req: Request & { file?: any }, res: Response, next: NextFunction) => {
      const {
        groupMemberId,
        depositAmount,
        solidarityAmount,
        paymentMethodId,
        receivedById,
        branchId,
        transactionId,
      } = req.body;

      // Handle file upload
      const documentReceipt = req.file ? req.file.filename : req.body.documentReceipt;

      const groupMember = await AppDataSource.getRepository(
        GroupMember
      ).findOne({
        where: { id: groupMemberId },
        relations: ["group", "member"],
      });

      if (!groupMember) {
        return next(new NotFoundError("Group member not found"));
      }

      const branch = await AppDataSource.getRepository(Branch).findOne({
        where: { id: branchId },
      });

      if (!branch) {
        return next(new NotFoundError("Branch not found"));
      }

      const currentSeason = await AppDataSource.getRepository(Season).findOne({
        where: { status: "active" },
      });

      if (!currentSeason) {
        return next(new NotFoundError("There is no active season"));
      }

      const paymentMethod = await AppDataSource.getRepository(
        PaymentMethod
      ).findOne({
        where: { id: paymentMethodId },
      });

      if (!paymentMethod) {
        return next(new NotFoundError("Payment method not found"));
      }

      const receivedBy = receivedById
        ? await AppDataSource.getRepository(User).findOne({ where: { id: receivedById } })
        : null;

      // Check if the group member is a leader (president, accountant, or secretary)
      const isLeader =
        groupMember.member.id === groupMember.group.president?.id ||
        groupMember.member.id === groupMember.group.accountant?.id ||
        groupMember.member.id === groupMember.group.secretary?.id;

      if (isLeader && !receivedBy) {
        return next(new NotFoundError("User not found"));
      }
      // For regular members, receivedBy can be null (no user account needed)

      // Get current saving and solidarity amounts for the member in this season
      const lastContribution = await this.repository.findOne({
        where: {
          groupMember: { id: groupMember.id },
          season: { id: currentSeason.id },
        },
        order: { createdAt: "DESC" },
      });

      let beforeSavingAmount = 0;
      let beforeSolidalityAmount = 0;

      if (lastContribution) {
        beforeSavingAmount = lastContribution.currentSavingAmount;
        beforeSolidalityAmount = lastContribution.currentSolidalityAmount;
      }

      // Calculate new amounts
      const currentSavingAmount = beforeSavingAmount + Number(depositAmount);
      const currentSolidalityAmount =
        beforeSolidalityAmount + Number(solidarityAmount);

      // Create new contribution
      const newContribution = this.repository.create({
        member: groupMember.member,
        groupMember,
        season: currentSeason,
        depositAmount,
        solidarityAmount,
        currentSavingAmount,
        currentSolidalityAmount,
        beforeSavingAmount,
        beforeSolidalityAmount,
        group: groupMember.group,
        paymentMethod,
        receivedBy,
        branch: branch,
        documentReceipt,
        transactionId,
      });

      const savedContribution = await this.repository.save(newContribution);

      res.status(201).json({
        status: "success",
        data: this.format(savedContribution),
      });
    }
  );

  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const contribution = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "member",
          "groupMember",
          "season",
          "group",
          "paymentMethod",
          "receivedBy",
          "fines",
        ],
      });

      if (!contribution) {
        return next(new NotFoundError("Contribution not found"));
      }

      res.status(200).json({
        status: "success",
        data: this.format(contribution),
      });
    }
  );

  update = asyncHandler(
    async (req: Request & { file?: any }, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const {
        groupMemberId,
        depositAmount,
        solidarityAmount,
        paymentMethodId,
        receivedById,
        branchId,
        transactionId,
      } = req.body;

      // Handle file upload
      const documentReceipt = req.file ? req.file.filename : req.body.documentReceipt;

      let contribution = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "member.id",
          "member",
          "groupMember",
          "season",
          "group",
          "paymentMethod",
          "receivedBy",
        ],
      });

      if (!contribution) {
        return next(new NotFoundError("Contribution not found"));
      }

      if (groupMemberId) {
        const groupMember = await AppDataSource.getRepository(
          GroupMember
        ).findOne({
          where: { id: groupMemberId },
        });
        if (!groupMember) {
          return next(new NotFoundError("Group member not found"));
        }
        contribution.groupMember = groupMember;
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
        contribution.paymentMethod = paymentMethod;
      }

      if (receivedById) {
        const receivedBy = await AppDataSource.getRepository(User).findOne({
          where: { id: receivedById },
        });
        if (!receivedBy) {
          return next(new NotFoundError("User not found"));
        }
        contribution.receivedBy = receivedBy;
      }

      if (branchId) {
        const branch = await AppDataSource.getRepository(Branch).findOne({
          where: { id: branchId },
        });
        if (!branch) {
          return next(new NotFoundError("Branch not found"));
        }
        contribution.branch = branch;
      }

      // If deposit amount or solidarity amount changes, recalculate amounts
      if (depositAmount !== undefined || solidarityAmount !== undefined) {
        const newDepositAmount =
          depositAmount !== undefined
            ? Number(depositAmount)
            : contribution.depositAmount;
        const newSolidarityAmount =
          solidarityAmount !== undefined
            ? Number(solidarityAmount)
            : contribution.solidarityAmount;

        // Get previous contribution to get the before amounts
        const previousContribution = await this.repository
          .createQueryBuilder("contribution")
          .where("contribution.member.id = :memberId", {
            memberId: contribution.member.id,
          })
          .andWhere("contribution.season.id = :seasonId", {
            seasonId: contribution.season.id,
          })
          .andWhere("contribution.id != :contributionId", {
            contributionId: contribution.id,
          })
          .orderBy("contribution.createdAt", "DESC")
          .getOne();

        let beforeSavingAmount = 0;
        let beforeSolidalityAmount = 0;

        if (previousContribution) {
          beforeSavingAmount = previousContribution.currentSavingAmount;
          beforeSolidalityAmount = previousContribution.currentSolidalityAmount;
        }

        // Update current amounts
        contribution.currentSavingAmount =
          beforeSavingAmount + newDepositAmount;
        contribution.currentSolidalityAmount =
          beforeSolidalityAmount + newSolidarityAmount;
        contribution.beforeSavingAmount = beforeSavingAmount;
        contribution.beforeSolidalityAmount = beforeSolidalityAmount;
        contribution.depositAmount = newDepositAmount;
        contribution.solidarityAmount = newSolidarityAmount;
      }

      // Update payment method specific fields
      if (documentReceipt !== undefined) {
        contribution.documentReceipt = documentReceipt;
      }
      if (transactionId !== undefined) {
        contribution.transactionId = transactionId;
      }

      // Update the contribution
      const updatedContribution = await this.repository.save(contribution);

      res.status(200).json({
        status: "success",
        data: this.format(updatedContribution),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;

      if (user.isAdmin) {
        const params: QueryParams = {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.page_size) || 25,
          filters: req.query.filters ? (typeof req.query.filters === 'string' ? JSON.parse(req.query.filters) : req.query.filters) : [],
          search: req.query.search ? String(req.query.search) : undefined,
          sortBy: req.query.sortBy ? String(req.query.sortBy) : undefined,
          order: req.query.order && (String(req.query.order).toUpperCase() === 'ASC' || String(req.query.order).toUpperCase() === 'DESC')
            ? String(req.query.order).toUpperCase() as 'ASC' | 'DESC'
            : undefined,
        };

        // Custom conditions array
        const customConditions = [];

        // *** ADD THIS NEW CODE HERE ***
        // Check for member filter and handle it specially
        if (params.filters && params.filters.length > 0) {
          const memberFilter = params.filters.find(f => f.field === "member" && f.operator === "in");
          if (memberFilter) {
            console.log("Found member filter:", memberFilter);
            // Convert the filter to use member.id instead
            customConditions.push({
              where: `member.id IN (:...memberIds)`,
              parameters: { memberIds: memberFilter.value }
            });

            // Remove the original member filter as we're handling it separately
            params.filters = params.filters.filter(f => f.field !== "member");
            console.log("Updated filters after member handling:", params.filters);
          }
        }
        // *** END OF NEW CODE ***

        // Handle search specifically for member names
        if (params.search) {
          customConditions.push({
            where: `(member.firstName ILIKE :search OR member.lastName ILIKE :search)`,
            parameters: { search: `%${params.search}%` }
          });
          // Remove the search parameter since we're handling it manually
          delete params.search;
        }

        // Add custom joins for related entities
        const customJoins = [
          "contributions.member",
          "contributions.group",
          "contributions.paymentMethod",
          "contributions.receivedBy",
          "contributions.branch"
        ];

        try {
          const result = await this.queryBuilder.buildAndExecute(
            params,
            customConditions,
            customJoins
          );

          console.log(`Found ${result.results?.length || 0} contributions`);

          // Calculate totalPages for pagination
          const totalPages = Math.ceil((result.total || 0) / (result.limit || 25));

          res.json({
            ...result,
            results: result.results?.map(this.format) || [],
            totalPages,
          });
        } catch (error) {
          console.error("Query execution error:", error);
          next(error);
        }
      } else if (user.role?.name === "President" || user.role?.name === "Accountant" || user.role?.name === "Secretary") {
        // Group leaders can only see contributions from their groups
        const { Group } = await import("../entities/Group");
        const groupRepository = AppDataSource.getRepository(Group);

        // Find groups where the user is a leader
        let userGroups = [];

        if (user.role?.name === "President") {
          const presidentGroups = await groupRepository.find({
            where: { president: { id: user.id } },
            select: ["id"]
          });
          userGroups = presidentGroups;
        } else if (user.role?.name === "Accountant") {
          const accountantGroups = await groupRepository.find({
            where: { accountant: { id: user.id } },
            select: ["id"]
          });
          userGroups = accountantGroups;
        } else if (user.role?.name === "Secretary") {
          const secretaryGroups = await groupRepository.find({
            where: { secretary: { id: user.id } },
            select: ["id"]
          });
          userGroups = secretaryGroups;
        }

        if (userGroups.length === 0) {
          // User is a leader but has no groups, return empty result
          res.json({
            results: [],
            pagination: {
              page: 1,
              limit: 25,
              total: 0,
              totalPages: 0
            }
          });
          return;
        }

        const groupIds = userGroups.map(g => g.id);

        // Get contributions from user's groups
        const contributions = await this.repository
          .createQueryBuilder("contribution")
          .leftJoinAndSelect("contribution.member", "member")
          .leftJoinAndSelect("contribution.group", "group")
          .leftJoinAndSelect("contribution.paymentMethod", "paymentMethod")
          .leftJoinAndSelect("contribution.receivedBy", "receivedBy")
          .leftJoinAndSelect("contribution.branch", "branch")
          .where("contribution.group.id IN (:...groupIds)", { groupIds })
          .orderBy("contribution.createdAt", "DESC")
          .getMany();

        const formattedResults = contributions.map(this.format);

        res.json({
          results: formattedResults,
          pagination: {
            page: 1,
            limit: contributions.length,
            total: contributions.length,
            totalPages: 1
          }
        });
      } else {
        // Regular members can only see their own contributions
        const contributions = await this.repository
          .createQueryBuilder("contribution")
          .leftJoinAndSelect("contribution.member", "member")
          .leftJoinAndSelect("contribution.group", "group")
          .leftJoinAndSelect("contribution.paymentMethod", "paymentMethod")
          .leftJoinAndSelect("contribution.receivedBy", "receivedBy")
          .leftJoinAndSelect("contribution.branch", "branch")
          .where("contribution.member.id = :memberId", { memberId: user.id })
          .orderBy("contribution.createdAt", "DESC")
          .getMany();

        const formattedResults = contributions.map(this.format);

        res.json({
          results: formattedResults,
          pagination: {
            page: 1,
            limit: contributions.length,
            total: contributions.length,
            totalPages: 1
          }
        });
      }
    }
  );

  delete = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const contribution = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["fines"],
      });

      if (!contribution) {
        return next(new NotFoundError("Contribution not found"));
      }

      // Check if contribution has related fines
      if (contribution.fines?.length) {
        return next(
          new BadRequestError(
            "Cannot delete contribution with associated fines"
          )
        );
      }

      await this.repository.remove(contribution);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );
}