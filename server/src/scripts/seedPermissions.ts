import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import * as bcrypt from "bcryptjs";

async function seedAdminUser() {
  console.log("Starting database initialization...");
  
  // Initialize database connection
  try {
    await AppDataSource.initialize();
    console.log("Database connection initialized");
  } catch (error) {
    console.error("Error initializing database connection:", error);
    process.exit(1);
  }

  try {
    // Create admin role if it doesn't exist
    console.log("Checking for admin role...");
    let adminRole = await Role.findOne({ where: { name: "admin" } });
    
    if (!adminRole) {
      console.log("Admin role not found, creating...");
      adminRole = new Role();
      adminRole.name = "admin";
      // Add default permissions for admin role
      adminRole.permissions = {
        users: ["create", "read", "update", "delete"],
        roles: ["create", "read", "update", "delete"],
        branches: ["create", "read", "update", "delete"],
        groups: ["create", "read", "update", "delete"],
        members: ["create", "read", "update", "delete"],
        contributions:["create", "read", "update", "delete"],
      };
      await adminRole.save();
      console.log("Admin role created successfully with full permissions");
    } else {
      console.log("Admin role already exists");
    }

    // Check if admin user exists
    console.log("Checking for admin user...");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminExists = await User.findOne({ where: { email: adminEmail } });
    
    if (!adminExists) {
      console.log("Admin user not found, creating...");
      const adminPassword = process.env.ADMIN_PASSWORD;
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const admin = new User();
      admin.name = "Administrator";
      admin.email = adminEmail;
      admin.password = hashedPassword;
      admin.isAdmin = true;
      admin.status = "active";
      admin.role = adminRole;
      
      await admin.save();
      console.log(`Admin user created with email: ${adminEmail}`);
    } else {
      console.log("Admin user already exists");
    }

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await AppDataSource.destroy();
    console.log("Database connection closed");
  }
}

// Run the seed function
seedAdminUser()
  .then(() => {
    console.log("Admin user seeding process finished");
    process.exit(0);
  })
  .catch(error => {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  });