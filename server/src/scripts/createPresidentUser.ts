import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Member } from "../entities/Member";
import { Role } from "../entities/Role";
import { Branch } from "../entities/Branch";
import { Group } from "../entities/Group";
import * as bcrypt from "bcryptjs";

interface CreatePresidentUserParams {
    // User details
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;

    // Member details
    idNumber: string;
    gender: "Male" | "Female" | "Other";
    marriageStatus: "Single" | "Married" | "Divorced" | "Widowed";
    country?: string;
    currentAddress?: string;
    sourceOfIncome: string;
    joinedAt: Date;

    // Branch and Group details
    branchId: number;
    groupId?: number; // Optional: if you want to assign as president of a specific group

    // Role details
    roleName?: string; // Defaults to "president" if not specified
}

async function createPresidentUser(params: CreatePresidentUserParams) {
    console.log("Starting president user creation...");

    // Initialize database connection
    try {
        await AppDataSource.initialize();
        console.log("Database connection initialized");
    } catch (error) {
        console.error("Error initializing database connection:", error);
        process.exit(1);
    }

    try {
        // 1. Validate branch exists
        const branch = await Branch.findOne({ where: { id: params.branchId } });
        if (!branch) {
            throw new Error(`Branch with ID ${params.branchId} not found`);
        }
        console.log(`✓ Branch found: ${branch.name}`);

        // 2. Create or find president role
        let presidentRole = await Role.findOne({ where: { name: params.roleName || "president" } });
        if (!presidentRole) {
            console.log("President role not found, creating...");
            presidentRole = new Role();
            presidentRole.name = params.roleName || "president";
            presidentRole.permissions = {
                groups: ["read", "update"],
                members: ["read", "update"],
                contributions: ["read", "update"],
                loans: ["read", "update"],
                meetings: ["read", "update"],
            };
            await presidentRole.save();
            console.log("✓ President role created successfully");
        } else {
            console.log("✓ President role found");
        }

        // 3. Check if member already exists
        let member = await Member.findOne({ where: { idNumber: params.idNumber } });
        if (!member) {
            console.log("Creating new member...");
            member = new Member();
            member.firstName = params.firstName;
            member.lastName = params.lastName;
            member.fullNames = `${params.firstName} ${params.lastName}`;
            member.gender = params.gender;
            member.phone = params.phone || '';
            member.marriageStatus = params.marriageStatus;
            member.idNumber = params.idNumber;
            member.country = params.country || '';
            member.currentAddress = params.currentAddress || '';
            member.sourceOfIncome = params.sourceOfIncome;
            member.joinedAt = params.joinedAt;
            member.branch = branch;

            await member.save();
            console.log("✓ Member created successfully");
        } else {
            console.log("✓ Member already exists");
        }

        // 4. Check if user already exists
        let user = await User.findOne({ where: { email: params.email } });
        if (!user) {
            console.log("Creating new user...");
            const hashedPassword = await bcrypt.hash(params.password, 10);

            user = new User();
            user.name = `${params.firstName} ${params.lastName}`;
            user.first_name = params.firstName;
            user.last_name = params.lastName;
            user.email = params.email;
            user.password = hashedPassword;
            user.phone = params.phone || '';
            user.status = "active";
            user.role = presidentRole;
            user.branch = branch;
            user.isAdmin = false;

            await user.save();
            console.log("✓ User created successfully");
        } else {
            console.log("✓ User already exists");
        }

        // 5. Optionally assign as president of a group
        if (params.groupId) {
            // First check if any groups exist
            const totalGroups = await Group.count();
            if (totalGroups === 0) {
                console.log("⚠️  No groups found in the database. Skipping group assignment.");
                console.log("💡 You can create a group first and then assign this user as president later.");
            } else {
                const group = await Group.findOne({
                    where: { id: params.groupId, branch: { id: branch.id } },
                    relations: ["branch"]
                });

                if (!group) {
                    console.log(`⚠️  Group with ID ${params.groupId} not found in branch ${branch.id}`);
                    console.log("💡 Available groups in this branch:");

                    const branchGroups = await Group.find({
                        where: { branch: { id: branch.id } },
                        relations: ["branch"]
                    });

                    if (branchGroups.length === 0) {
                        console.log("   No groups found in this branch");
                    } else {
                        branchGroups.forEach(g => {
                            console.log(`   - Group ID: ${g.id}, Name: ${g.name}`);
                        });
                    }
                    console.log("💡 You can run 'npm run list:groups' to see all available groups");
                } else {
                    group.president = member;
                    await group.save();
                    console.log(`✓ Assigned as president of group: ${group.name}`);
                }
            }
        }

        console.log("\n🎉 President user creation completed successfully!");
        console.log("\nSummary:");
        console.log(`- Member ID: ${member.id}`);
        console.log(`- User ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Role: ${presidentRole.name}`);
        if (params.groupId) {
            console.log(`- Group President: Yes`);
        }

    } catch (error) {
        console.error("Error creating president user:", error);
        process.exit(1);
    } finally {
        // Close database connection
        await AppDataSource.destroy();
        console.log("Database connection closed");
    }
}

// Example usage - you can modify these values
const exampleParams: CreatePresidentUserParams = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "password123",
    phone: "+1234567890",
    idNumber: "ID123456789",
    gender: "Male",
    marriageStatus: "Married",
    country: "Rwanda",
    currentAddress: "Kigali, Rwanda",
    sourceOfIncome: "Business",
    joinedAt: new Date(),
    branchId: 1, // Replace with actual branch ID
    groupId: 1,  // Optional: Replace with actual group ID if you want to assign as president
    roleName: "president"
};

// Uncomment the line below to run the script
// createPresidentUser(exampleParams);

export { createPresidentUser, CreatePresidentUserParams }; 