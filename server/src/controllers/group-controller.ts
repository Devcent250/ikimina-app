import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Group } from "../entities/Group";
import { Repository, Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError } from "../errors/http.errors";
import { Member } from "../entities/Member";
import { Branch } from "../entities/Branch";
import { QueryParams } from "../types/QueryParams";
import { User } from "../entities/User";
import bcrypt from "bcrypt";

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
      members: group.groupMembers?.length || 0,
    };
  };

  // Helper to ensure leader credentials and user record
  private async ensureLeaderCredentials(member: Member, email?: string, password?: string) {
    console.log('Ensuring leader credentials for:', member.fullNames, email);

    // If no credentials provided, check if member already has them
    if (!email || !password) {
      if (member.email && member.password) {
        console.log('Member already has credentials, skipping:', member.fullNames);
        return; // Member already has credentials, no need to update
      } else {
        console.log('Missing email or password for leader:', member.fullNames);
        throw new Error("Email and password are required for leaders who do not have credentials.");
      }
    }

    // Update member credentials
    member.email = email;
    member.password = await bcrypt.hash(password, 10);
    await this.memberRepository.save(member);
    console.log('Updated member with credentials:', member.email);

    // Ensure user record exists/updated
    let user = await this.userRepository.findOne({ where: { email } });
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!user) {
      user = this.userRepository.create({
        name: member.fullNames,
        first_name: member.firstName,
        last_name: member.lastName,
        email,
        password: hashedPassword,
        status: "active",
        isAdmin: false,
        branch: member.branch,
        group: undefined, // Optionally set group if needed
      });
      console.log('Creating new user for leader:', email);
    } else {
      user.password = hashedPassword;
      user.name = member.fullNames;
      user.first_name = member.firstName;
      user.last_name = member.lastName;
      user.status = "active";
      console.log('Updating existing user for leader:', email);
    }
    await this.userRepository.save(user);
    console.log('Saved user:', user.email);
  }

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        name,
        description,
        presidentId,
        accountantId,
        secretaryId,
        meetingFrequency,
        meetingDay,
        meetingStartTime,
        meetingEndTime,
        meetingLocation,
        meetingLocationDetails,
        meetingDurationMinutes,
        isActive,
        pricePerShare,
        minShares,
        maxShares,
        branchId,
        solidarityAmount,
        additionalNotes,
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

      // Check for duplicate leader assignments within the same group
      const leaderIds = [presidentId, accountantId, secretaryId].filter(id => id !== undefined && id !== null);
      const uniqueLeaderIds = new Set(leaderIds);

      if (leaderIds.length !== uniqueLeaderIds.size) {
        return next(new Error("A person cannot be assigned to multiple leader roles in the same group."));
      }

      // Check if leaders are already assigned to other groups
      if (presidentId) {
        const existingPresidentGroup = await this.repository.findOne({
          where: { president: { id: presidentId } },
        });
        if (existingPresidentGroup) {
          return next(new Error(`The selected President is already a leader in group "${existingPresidentGroup.name}". A person cannot be a leader in multiple groups.`));
        }
      }

      if (accountantId) {
        const existingAccountantGroup = await this.repository.findOne({
          where: { accountant: { id: accountantId } },
        });
        if (existingAccountantGroup) {
          return next(new Error(`The selected Accountant is already a leader in group "${existingAccountantGroup.name}". A person cannot be a leader in multiple groups.`));
        }
      }

      if (secretaryId) {
        const existingSecretaryGroup = await this.repository.findOne({
          where: { secretary: { id: secretaryId } },
        });
        if (existingSecretaryGroup) {
          return next(new Error(`The selected Secretary is already a leader in group "${existingSecretaryGroup.name}". A person cannot be a leader in multiple groups.`));
        }
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
        await this.ensureLeaderCredentials(
          president,
          req.body.presidentEmail,
          req.body.presidentPassword
        );
      }

      if (accountantId) {
        accountant = await this.memberRepository.findOne({
          where: { id: accountantId },
        });
        if (!accountant) {
          return next(new NotFoundError("Accountant member not found"));
        }
        await this.ensureLeaderCredentials(
          accountant,
          req.body.accountantEmail,
          req.body.accountantPassword
        );
      }

      if (secretaryId) {
        secretary = await this.memberRepository.findOne({
          where: { id: secretaryId },
        });
        if (!secretary) {
          return next(new NotFoundError("Secretary member not found"));
        }
        await this.ensureLeaderCredentials(
          secretary,
          req.body.secretaryEmail,
          req.body.secretaryPassword
        );
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
          meetingDay,
          meetingStartTime,
          meetingEndTime,
          meetingLocation,
          meetingLocationDetails,
          meetingDurationMinutes,
          isActive,
          pricePerShare,
          minShares,
          maxShares,
          branch,
          solidarityAmount,
          additionalNotes,
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
        meetingDay,
        meetingStartTime,
        meetingEndTime,
        meetingLocation,
        meetingLocationDetails,
        meetingDurationMinutes,
        isActive,
        pricePerShare,
        minShares,
        maxShares,
        branch,
        solidarityAmount,
        additionalNotes,
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
      console.log("user==", req.user)
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
          "branch.district",
          "groupMembers",
          "groupMembers.member",
          "groupMembers.branch",
          "contributions",
          "contributions.member",
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

      console.log('Backend received body:', req.body);
      console.log('President Email from body:', req.body.presidentEmail);
      console.log('President Password from body:', req.body.presidentPassword);

      const {
        name,
        description,
        presidentId,
        accountantId,
        secretaryId,
        meetingFrequency,
        meetingDay,
        meetingStartTime,
        meetingEndTime,
        meetingLocation,
        meetingLocationDetails,
        meetingDurationMinutes,
        isActive,
        pricePerShare,
        minShares,
        maxShares,
        branchId,
        solidarityAmount,
        additionalNotes,
      } = req.body;

      let group = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "president",
          "accountant",
          "secretary",
          "branch",
          "groupMembers",
          "groupMembers.branch",
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

      // Check for duplicate leader assignments within the same group
      const leaderIds = [presidentId, accountantId, secretaryId].filter(id => id !== undefined && id !== null);
      const uniqueLeaderIds = new Set(leaderIds);

      if (leaderIds.length !== uniqueLeaderIds.size) {
        return next(new Error("A person cannot be assigned to multiple leader roles in the same group."));
      }

      // Check if leaders are already assigned to other groups (excluding current group)
      if (presidentId) {
        const existingPresidentGroup = await this.repository.findOne({
          where: { president: { id: presidentId }, id: Not(Number(recordId)) },
        });
        if (existingPresidentGroup) {
          return next(new Error(`The selected President is already a leader in group "${existingPresidentGroup.name}". A person cannot be a leader in multiple groups.`));
        }
      }

      if (accountantId) {
        const existingAccountantGroup = await this.repository.findOne({
          where: { accountant: { id: accountantId }, id: Not(Number(recordId)) },
        });
        if (existingAccountantGroup) {
          return next(new Error(`The selected Accountant is already a leader in group "${existingAccountantGroup.name}". A person cannot be a leader in multiple groups.`));
        }
      }

      if (secretaryId) {
        const existingSecretaryGroup = await this.repository.findOne({
          where: { secretary: { id: secretaryId }, id: Not(Number(recordId)) },
        });
        if (existingSecretaryGroup) {
          return next(new Error(`The selected Secretary is already a leader in group "${existingSecretaryGroup.name}". A person cannot be a leader in multiple groups.`));
        }
      }

      // Validate officers if provided
      if (presidentId) {
        const president = await this.memberRepository.findOne({
          where: { id: presidentId },
        });
        if (!president) {
          return next(new NotFoundError("President member not found"));
        }
        await this.ensureLeaderCredentials(
          president,
          req.body.presidentEmail,
          req.body.presidentPassword
        );
        group.president = president;
      }

      if (accountantId) {
        const accountant = await this.memberRepository.findOne({
          where: { id: accountantId },
        });
        if (!accountant) {
          return next(new NotFoundError("Accountant member not found"));
        }
        await this.ensureLeaderCredentials(
          accountant,
          req.body.accountantEmail,
          req.body.accountantPassword
        );
        group.accountant = accountant;
      }

      if (secretaryId) {
        const secretary = await this.memberRepository.findOne({
          where: { id: secretaryId },
        });
        if (!secretary) {
          return next(new NotFoundError("Secretary member not found"));
        }
        await this.ensureLeaderCredentials(
          secretary,
          req.body.secretaryEmail,
          req.body.secretaryPassword
        );
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
      if (meetingFrequency !== undefined) group.meetingFrequency = meetingFrequency;
      if (meetingDay !== undefined) group.meetingDay = meetingDay;
      if (meetingStartTime !== undefined) group.meetingStartTime = meetingStartTime;
      if (meetingEndTime !== undefined) group.meetingEndTime = meetingEndTime;
      if (meetingLocation !== undefined) group.meetingLocation = meetingLocation;
      if (meetingLocationDetails !== undefined) group.meetingLocationDetails = meetingLocationDetails;
      if (meetingDurationMinutes !== undefined) group.meetingDurationMinutes = meetingDurationMinutes;
      if (isActive !== undefined) group.isActive = isActive;
      if (pricePerShare !== undefined) group.pricePerShare = pricePerShare;
      if (minShares !== undefined) group.minShares = minShares;
      if (maxShares !== undefined) group.maxShares = maxShares;
      if (solidarityAmount !== undefined) group.solidarityAmount = solidarityAmount;
      if (additionalNotes !== undefined) group.additionalNotes = additionalNotes;

      const updatedGroup = await this.repository.save(group);

      res.status(200).json({
        status: "success",
        data: this.format(updatedGroup),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Use direct query to ensure groupMembers are loaded
      const groups = await this.repository.find({
        relations: [
          "branch",
          "groupMembers",
          "groupMembers.branch",
          "president",
          "accountant",
          "secretary",
        ],
      });

      // Add debugging
      console.log("Raw groups data:", groups.map(group => ({
        id: group.id,
        name: group.name,
        groupMembersCount: group.groupMembers?.length || 0,
        groupMembers: group.groupMembers
      })));

      const formattedResults = groups.map(this.format);

      // Add debugging for formatted results
      console.log("Formatted groups data:", formattedResults.map(group => ({
        id: group.id,
        name: group.name,
        members: group.members
      })));

      res.json({
        results: formattedResults,
        total: groups.length,
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
          "groupMembers.branch",
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