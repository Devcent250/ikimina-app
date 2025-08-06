import { AppDataSource } from "../data-source";
import { Group } from "../entities/Group";
import { Branch } from "../entities/Branch";

async function listGroups() {
    console.log("🔍 Listing all groups...");

    // Initialize database connection
    try {
        await AppDataSource.initialize();
        console.log("Database connection initialized");
    } catch (error) {
        console.error("Error initializing database connection:", error);
        process.exit(1);
    }

    try {
        // Get all groups with their branch information
        const groups = await Group.find({
            relations: ["branch", "president", "accountant", "secretary"]
        });

        if (groups.length === 0) {
            console.log("❌ No groups found in the database");
            console.log("\n💡 You need to create a group first before assigning a president.");
            console.log("   You can create groups through the application interface or API.");
        } else {
            console.log(`\n📋 Found ${groups.length} group(s):\n`);

            groups.forEach((group, index) => {
                console.log(`${index + 1}. Group ID: ${group.id}`);
                console.log(`   Name: ${group.name}`);
                console.log(`   Branch: ${group.branch?.name || 'No branch'} (ID: ${group.branch?.id || 'N/A'})`);
                console.log(`   Description: ${group.description || 'No description'}`);
                console.log(`   President: ${group.president?.fullNames || 'Not assigned'}`);
                console.log(`   Accountant: ${group.accountant?.fullNames || 'Not assigned'}`);
                console.log(`   Secretary: ${group.secretary?.fullNames || 'Not assigned'}`);
                console.log(`   Active: ${group.isActive ? 'Yes' : 'No'}`);
                console.log(`   Meeting Frequency: ${group.meetingFrequency}`);
                console.log(`   Price per Share: ${group.pricePerShare}`);
                console.log(`   Min Shares: ${group.minShares}`);
                console.log(`   Max Shares: ${group.maxShares}`);
                console.log(`   Solidarity Amount: ${group.solidarityAmount}`);
                console.log("   " + "─".repeat(50));
            });
        }

        // Also list all branches
        const branches = await Branch.find();
        console.log(`\n🏢 Available Branches (${branches.length}):\n`);

        branches.forEach((branch, index) => {
            console.log(`${index + 1}. Branch ID: ${branch.id}`);
            console.log(`   Name: ${branch.name}`);
            console.log(`   Location: ${branch.location || 'No location'}`);
            console.log("   " + "─".repeat(30));
        });

    } catch (error) {
        console.error("Error listing groups:", error);
    } finally {
        // Close database connection
        await AppDataSource.destroy();
        console.log("\nDatabase connection closed");
    }
}

// Run the script
if (require.main === module) {
    listGroups();
} 