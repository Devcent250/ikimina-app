import { createPresidentUser, CreatePresidentUserParams } from "./createPresidentUser";
import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function createPresidentUserInteractive() {
    console.log("🤖 President User Creation Wizard");
    console.log("================================\n");

    try {
        // User details
        const firstName = await question("First Name: ");
        const lastName = await question("Last Name: ");
        const email = await question("Email: ");
        const password = await question("Password (min 6 characters): ");
        const phone = await question("Phone (optional): ");

        // Member details
        const idNumber = await question("ID Number: ");
        const gender = await question("Gender (Male/Female/Other): ") as "Male" | "Female" | "Other";
        const marriageStatus = await question("Marriage Status (Single/Married/Divorced/Widowed): ") as "Single" | "Married" | "Divorced" | "Widowed";
        const country = await question("Country (optional): ");
        const currentAddress = await question("Current Address (optional): ");
        const sourceOfIncome = await question("Source of Income: ");
        const joinedAtStr = await question("Joined Date (YYYY-MM-DD): ");
        const joinedAt = new Date(joinedAtStr);

        // Branch and Group details
        const branchId = parseInt(await question("Branch ID: "));
        const assignAsGroupPresident = await question("Assign as group president? (y/n): ");
        let groupId: number | undefined;

        if (assignAsGroupPresident.toLowerCase() === 'y') {
            console.log("\n💡 Tip: Run 'npm run list:groups' to see available groups");
            groupId = parseInt(await question("Group ID: "));
        }

        // Role details
        const roleName = await question("Role Name (default: president): ") || "president";

        const params: CreatePresidentUserParams = {
            firstName,
            lastName,
            email,
            password,
            phone: phone || undefined,
            idNumber,
            gender,
            marriageStatus,
            country: country || undefined,
            currentAddress: currentAddress || undefined,
            sourceOfIncome,
            joinedAt,
            branchId,
            groupId,
            roleName
        };

        console.log("\n📋 Summary:");
        console.log(`Name: ${firstName} ${lastName}`);
        console.log(`Email: ${email}`);
        console.log(`ID Number: ${idNumber}`);
        console.log(`Branch ID: ${branchId}`);
        if (groupId) {
            console.log(`Group ID: ${groupId}`);
        }
        console.log(`Role: ${roleName}`);

        const confirm = await question("\nProceed with creation? (y/n): ");

        if (confirm.toLowerCase() === 'y') {
            await createPresidentUser(params);
        } else {
            console.log("❌ Creation cancelled");
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        rl.close();
    }
}

// Run the interactive script
if (require.main === module) {
    createPresidentUserInteractive();
} 