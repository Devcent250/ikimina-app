import { createPresidentUser } from "./createPresidentUser";

// Example: Create a president user programmatically
async function createExamplePresidentUser() {
  const presidentParams = {
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@example.com",
    password: "securePassword123",
    phone: "+250789123456",
    idNumber: "ID987654321",
    gender: "Female" as const,
    marriageStatus: "Married" as const,
    country: "Rwanda",
    currentAddress: "Kigali, Gasabo District",
    sourceOfIncome: "Business Owner",
    joinedAt: new Date("2024-01-15"),
    branchId: 1, // Replace with your actual branch ID
    groupId: 1,  // Optional: Replace with your actual group ID
    roleName: "president"
  };

  try {
    await createPresidentUser(presidentParams);
    console.log("✅ Example president user created successfully!");
  } catch (error) {
    console.error("❌ Error creating example president user:", error);
  }
}

// Run the example
if (require.main === module) {
  createExamplePresidentUser();
} 