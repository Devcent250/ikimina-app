import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { Member } from "../entities/Member";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError, BadRequestError } from "../errors/http.errors";
import { QueryParams } from "../types/QueryParams";
import { GroupMember } from "../entities/GroupMember";
import { District } from "../entities/District";
import { Branch } from "../entities/Branch";
import { Group } from "../entities/Group";
import { User } from "../entities/User";
import bcrypt from "bcrypt";

export class MemberController {
  private repository: Repository<Member> = AppDataSource.getRepository(Member);
  private groupMemberRepository: Repository<GroupMember> = AppDataSource.getRepository(GroupMember);
  private districtRepository: Repository<District> = AppDataSource.getRepository(District);
  private branchRepository: Repository<Branch> = AppDataSource.getRepository(Branch);
  private groupRepository: Repository<Group> = AppDataSource.getRepository(Group);
  private userRepository: Repository<User> = AppDataSource.getRepository(User);
  private queryBuilder: QueryBuilder<Member>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "members",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: [
        "firstName",
        "lastName",
        "fullNames",
        "idNumber",
        "phone",
      ],
      allowedSortFields: ["createdAt", "updatedAt", "joinedAt", "fullNames"],
      filterableFields: [
        "branch",
        "gender",
        "marriageStatus",
        "sourceOfIncome",
      ],
    });
  }

  private format = async (member: Member) => {
    // Calculate current savings from contributions
    const currentSavings = member.contributions
      ? member.contributions.reduce((sum, c) => sum + (c.depositAmount || 0), 0)
      : 0;

    // Get leader roles for this member
    const { Group } = await import("../entities/Group");
    const groupRepository = AppDataSource.getRepository(Group);

    const presidentGroups = await groupRepository.find({
      where: { president: { id: member.id } },
      select: ["id", "name"]
    });

    const accountantGroups = await groupRepository.find({
      where: { accountant: { id: member.id } },
      select: ["id", "name"]
    });

    const secretaryGroups = await groupRepository.find({
      where: { secretary: { id: member.id } },
      select: ["id", "name"]
    });

    // Create leader roles array
    const leaderRoles = [
      ...presidentGroups.map(g => ({ role: "President", group: g })),
      ...accountantGroups.map(g => ({ role: "Accountant", group: g })),
      ...secretaryGroups.map(g => ({ role: "Secretary", group: g }))
    ];

    return {
      ...member,
      groups: member.groupMemberships?.map(gm => gm.group).filter(Boolean) || [],
      currentSavings,
      leaderRoles,
    };
  };

  // Helper to ensure leader credentials and user record with transaction
  private async ensureLeaderCredentialsWithTransaction(queryRunner: any, member: Member, email: string, password: string) {
    console.log('Ensuring leader credentials for:', member.fullNames, email);

    // Update member credentials
    const memberHashedPassword = await bcrypt.hash(password, 10);
    member.email = email;
    member.password = memberHashedPassword;
    await queryRunner.manager.save(Member, member);
    console.log('Updated member with credentials:', member.email);

    // Ensure user record exists/updated
    let user = await queryRunner.manager.findOne(User, { where: { email } });
    const userHashedPassword = await bcrypt.hash(password, 10);
    if (!user) {
      user = queryRunner.manager.create(User, {
        name: member.fullNames,
        first_name: member.firstName,
        last_name: member.lastName,
        email,
        password: userHashedPassword,
        status: "active",
        isAdmin: false,
      });
    } else {
      user.password = userHashedPassword;
      user.name = member.fullNames;
      user.first_name = member.firstName;
      user.last_name = member.lastName;
      user.status = "active";
    }
    await queryRunner.manager.save(User, user);
    console.log('Ensured user record:', user.email);
  }

  // Helper to ensure leader credentials and user record
  private async ensureLeaderCredentials(member: Member, email: string, password: string) {
    console.log('Ensuring leader credentials for:', member.fullNames, email);

    // Update member credentials
    member.email = email;
    member.password = await bcrypt.hash(password, 10);
    await this.repository.save(member);
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
      });
    } else {
      user.password = hashedPassword;
      user.name = member.fullNames;
      user.first_name = member.firstName;
      user.last_name = member.lastName;
      user.status = "active";
    }
    await this.userRepository.save(user);
    console.log('Ensured user record:', user.email);
  }

  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // Check if member with same ID number already exists
      if (req.body.idNumber) {
        const existingMember = await this.repository.findOne({
          where: { idNumber: req.body.idNumber },
        });

        if (existingMember) {
          return next(
            new BadRequestError("Member with this ID number already exists", {
              errors: { idNumber: "Member with this ID number already exists" },
            })
          );
        }
      }

      // Generate fullNames if not provided
      if (!req.body.fullNames && req.body.firstName && req.body.lastName) {
        req.body.fullNames = `${req.body.firstName} ${req.body.lastName}`;
      }

      const { groupIds, districtId, branchId, roleAssignments, ...memberData } = req.body;

      // Start a transaction to ensure data consistency
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Validate district exists
        const district = await queryRunner.manager.findOne(District, {
          where: { id: districtId },
          relations: ["branches"]
        });

        if (!district) {
          await queryRunner.rollbackTransaction();
          return next(new NotFoundError("District not found"));
        }

        // If branchId is provided, validate it belongs to the district
        let branch: Branch | undefined;
        if (branchId) {
          branch = district.branches.find(b => b.id === branchId);
          if (!branch) {
            await queryRunner.rollbackTransaction();
            return next(new BadRequestError("Selected branch does not belong to the selected district"));
          }
        } else if (district.branches.length > 0) {
          // If no branch specified, use the first branch in the district
          branch = district.branches[0];
        } else {
          await queryRunner.rollbackTransaction();
          return next(new BadRequestError("No branches available in the selected district"));
        }

        const newMember = queryRunner.manager.create(Member, {
          ...memberData,
          branch: { id: branch.id }
        });

        // Save the member
        const savedMember = await queryRunner.manager.save(Member, newMember) as Member;

        if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
          // Create group memberships
          for (const groupId of groupIds.filter(id => id && id.trim() !== "")) {
            try {
              if (!groupId || isNaN(parseInt(groupId))) {
                continue;
              }

              const groupMembership = queryRunner.manager.create(GroupMember, {
                member: { id: savedMember.id },
                group: { id: parseInt(groupId) },
                branch: { id: branch.id }
              });

              await queryRunner.manager.save(GroupMember, groupMembership);
            } catch (error) {
              console.error(`Error creating group membership for group ${groupId}:`, error);
            }
          }
        }

        // Handle role assignments
        if (roleAssignments && Array.isArray(roleAssignments) && roleAssignments.length > 0) {
          for (const roleAssignment of roleAssignments) {
            try {
              const { groupId, role, email, password } = roleAssignment;

              // Validate group exists
              const group = await queryRunner.manager.findOne(Group, {
                where: { id: groupId },
                relations: ["president", "accountant", "secretary"]
              });

              if (!group) {
                console.error(`Group with ID ${groupId} not found`);
                continue;
              }

              // Check if the role is already assigned
              const roleField = role.toLowerCase() as 'president' | 'accountant' | 'secretary';
              if (group[roleField]) {
                console.error(`${role} role is already assigned in group "${group.name}"`);
                continue;
              }

              // Ensure member has group membership
              let groupMembership = await queryRunner.manager.findOne(GroupMember, {
                where: {
                  member: { id: savedMember.id },
                  group: { id: groupId }
                }
              });

              if (!groupMembership) {
                groupMembership = queryRunner.manager.create(GroupMember, {
                  member: { id: savedMember.id },
                  group: { id: groupId },
                  branch: { id: branch.id },
                  loanEligibility: true,
                  numberOfShares: 0,
                });
                await queryRunner.manager.save(GroupMember, groupMembership);
              }

              // Set up leader credentials
              await this.ensureLeaderCredentialsWithTransaction(queryRunner, savedMember, email, password);

              // Assign the role
              group[roleField] = { id: savedMember.id } as Member;
              await queryRunner.manager.save(Group, group);

              console.log(`Assigned ${role} role to ${savedMember.fullNames} in group "${group.name}"`);

              // Verify the assignment was successful
              const updatedGroup = await queryRunner.manager.findOne(Group, {
                where: { id: groupId },
                relations: ["president", "accountant", "secretary"]
              });
              console.log(`Verification - ${role} assigned:`, updatedGroup[roleField]?.id === savedMember.id);
            } catch (error) {
              console.error(`Error assigning role ${roleAssignment.role}:`, error);
            }
          }
        }

        // Commit the transaction
        await queryRunner.commitTransaction();

        // Fetch the member with relations to return complete data
        const memberWithRelations = await this.repository.findOne({
          where: { id: savedMember.id },
          relations: ["branch", "branch.district", "groupMemberships", "groupMemberships.group", "groupMemberships.branch"]
        });

        res.status(201).json({
          status: "success",
          data: await this.format(memberWithRelations),
        });

      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  );


  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const member = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: [
          "branch",
          "groupMemberships",
          "groupMemberships.group",
          "groupMemberships.group.contributions",
          "groupMemberships.branch",
          "contributions"
        ],
      });

      if (!member) {
        return next(new NotFoundError("Member not found"));
      }

      // Format the response to include member-specific contributions and calculate shares
      const formattedMember = {
        ...member,
        groupMemberships: member.groupMemberships?.map(gm => {
          // Find the member's contribution in this group
          const memberContribution = gm.group.contributions?.find(
            (contribution) => contribution.member?.id === member.id
          );

          // Calculate number of shares based on deposit amount
          const numberOfShares = memberContribution
            ? Math.floor(memberContribution.depositAmount / gm.group.pricePerShare)
            : 0;

          return {
            ...gm,
            numberOfShares, // Add the calculated shares
            group: {
              ...gm.group,
              contributions: gm.group.contributions?.filter(c => c.member?.id === member.id) || []
            }
          };
        })
      };

      // Format with leader roles
      const formattedWithLeaderRoles = await this.format(member);

      // Merge the additional data from formattedMember
      const finalData = {
        ...formattedWithLeaderRoles,
        groupMemberships: formattedMember.groupMemberships
      };

      res.status(200).json({
        status: "success",
        data: finalData,
      });
    }
  );

  update = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;
      const { groupIds, ...memberData } = req.body;

      let member = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["groupMemberships", "groupMemberships.group", "groupMemberships.branch"]
      });

      if (!member) {
        return next(new NotFoundError("Member not found"));
      }

      // Handle ID number uniqueness checks...

      // Update the member basic data
      this.repository.merge(member, {
        ...memberData,
        branch: memberData.branchId ? { id: memberData.branchId } : member.branch
      });
      const updatedMember = await this.repository.save(member);

      // Update group memberships if provided
      if (groupIds && Array.isArray(groupIds)) {
        // Get existing group IDs
        const existingGroupIds = member.groupMemberships.map(gm =>
          gm.group?.id?.toString() || gm.group?.toString()
        ).filter(Boolean);

        // Find IDs to add and remove
        const idsToAdd = groupIds.filter(id => !existingGroupIds.includes(id));
        const idsToRemove = existingGroupIds.filter(id => !groupIds.includes(id));

        // Add new memberships
        for (const groupId of idsToAdd) {
          if (!groupId || isNaN(parseInt(groupId))) continue;

          const groupMembership = this.groupMemberRepository.create({
            member: { id: updatedMember.id },
            group: { id: parseInt(groupId) },
            branch: memberData.branchId ? { id: memberData.branchId } : member.branch?.id ? { id: member.branch.id } : undefined
          });

          await this.groupMemberRepository.save(groupMembership);
        }

        // Remove old memberships
        for (const groupId of idsToRemove) {
          if (!groupId) continue;

          await this.groupMemberRepository.delete({
            member: { id: updatedMember.id },
            group: { id: parseInt(groupId) }
          });
        }
      }

      // Fetch updated member with all relations
      const refreshedMember = await this.repository.findOne({
        where: { id: updatedMember.id },
        relations: ["branch", "groupMemberships", "groupMemberships.group"]
      });

      res.status(200).json({
        status: "success",
        data: await this.format(refreshedMember),
      });
    }
  );

  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;

      // Check user permissions and filter data accordingly
      if (user.isAdmin) {
        // Admin can see all members - proceed with normal query
        const baseResult = await this.queryBuilder.buildAndExecute(
          req.query as QueryParams
        );

        // Then manually fetch all members with their complete relations
        if (baseResult.results.length > 0) {
          const memberIds = baseResult.results.map(member => member.id);

          const membersWithRelations = await this.repository
            .createQueryBuilder("member")
            .leftJoinAndSelect("member.branch", "branch")
            .leftJoinAndSelect("member.groupMemberships", "groupMemberships")
            .leftJoinAndSelect("groupMemberships.group", "group")
            .leftJoinAndSelect("groupMemberships.branch", "groupMembershipsBranch")
            .leftJoinAndSelect("member.contributions", "contributions")
            .leftJoinAndSelect("member.loans", "loans")
            .whereInIds(memberIds)
            .getMany();

          // Map the members by ID for easy lookup
          const memberMap = new Map();
          membersWithRelations.forEach(member => {
            memberMap.set(member.id, {
              ...member,
              groups: member.groupMemberships?.map(gm => gm.group).filter(Boolean) || []
            });
          });

          // Replace the results with the enhanced members
          const enhancedResults = baseResult.results.map(member =>
            memberMap.get(member.id) || member
          );

          // Format all members with leader roles
          const formattedResults = await Promise.all(
            enhancedResults.map(member => this.format(member))
          );

          res.json({
            ...baseResult,
            results: formattedResults,
          });
        } else {
          // Format all members with leader roles
          const formattedResults = await Promise.all(
            baseResult.results.map(member => this.format(member))
          );

          res.json({
            ...baseResult,
            results: formattedResults,
          });
        }
      } else if (user.role?.name === "President" || user.role?.name === "Accountant" || user.role?.name === "Secretary") {
        // Group leaders can only see members from their groups
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

        // Get members from user's groups
        const members = await this.repository
          .createQueryBuilder("member")
          .leftJoinAndSelect("member.branch", "branch")
          .leftJoinAndSelect("member.groupMemberships", "groupMemberships")
          .leftJoinAndSelect("groupMemberships.group", "group")
          .leftJoinAndSelect("groupMemberships.branch", "groupMembershipsBranch")
          .leftJoinAndSelect("member.contributions", "contributions")
          .leftJoinAndSelect("member.loans", "loans")
          .where("groupMemberships.group.id IN (:...groupIds)", { groupIds })
          .getMany();

        // Format members with leader roles
        const formattedResults = await Promise.all(
          members.map(member => this.format(member))
        );

        res.json({
          results: formattedResults,
          pagination: {
            page: 1,
            limit: members.length,
            total: members.length,
            totalPages: 1
          }
        });
      } else {
        // Regular members can only see their own member record
        const member = await this.repository.findOne({
          where: { id: user.id },
          relations: ["branch", "groupMemberships", "groupMemberships.group", "contributions", "loans"]
        });

        if (!member) {
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

        const formattedMember = await this.format(member);

        res.json({
          results: [formattedMember],
          pagination: {
            page: 1,
            limit: 1,
            total: 1,
            totalPages: 1
          }
        });
      }
    }
  );

  delete = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { recordId } = req.params;

      const member = await this.repository.findOne({
        where: { id: Number(recordId) },
        relations: ["groupMemberships", "groupMemberships.branch", "contributions", "loans"],
      });

      if (!member) {
        return next(new NotFoundError("Member not found"));
      }

      // Check if member has related data to prevent cascading deletion
      if (
        member.groupMemberships?.length ||
        member.contributions?.length ||
        member.loans?.length
      ) {
        return next(
          new BadRequestError(
            "Cannot delete member with group memberships, contributions, or loans"
          )
        );
      }

      await this.repository.remove(member);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  );

  import = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => { }
  );
}