import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "./entities/User";
import { RefreshToken } from "./entities/RefreshToken";
import { PasswordReset } from "./entities/PasswordReset";
import { Attendance } from "./entities/Attendance";
import { Branch } from "./entities/Branch";
import { Contribution } from "./entities/Contribution";
import { Expense } from "./entities/Expense";
import { Fine } from "./entities/Fine";
import { ExpenseCategory } from "./entities/ExpenseCategory";
import { GroupMember } from "./entities/GroupMember";
import { Loan } from "./entities/Loan";
import { LoanPayment } from "./entities/LoanPayment";
import { LoanVerification } from "./entities/LoanVerification";
import { Member } from "./entities/Member";
import { PaymentMethod } from "./entities/PaymentMethod";
import { Role } from "./entities/Role";
import { Season } from "./entities/Season";
import { Group } from "./entities/Group";
import { District } from "./entities/District";
import { LoanCategory } from "./entities/LoanCategory";
dotenv.config();

// Debug logging
console.log("🔍 NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
if (process.env.DATABASE_URL) {
  console.log("🔍 DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 20) + "...");
} else {
  console.error("❌ DATABASE_URL is not set! This will cause connection to fail.");
  console.log("🔍 Available env vars:", Object.keys(process.env).filter(key => key.includes('DATABASE')));
}

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required but not set");
}

export const MIGRATION_FILES =
  process.env.NODE_ENV === "development"
    ? ["./src/database/migrations/*.ts"]
    : []; // Empty array for production to avoid migration import issues

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    PasswordReset,
    RefreshToken,
    Attendance,
    Branch,
    Contribution,
    Expense,
    Fine,
    ExpenseCategory,
    Group,
    District,
    GroupMember,
    Loan,
    LoanCategory,
    LoanPayment,
    LoanVerification,
    Member,
    PaymentMethod,
    Role,
    Season,
  ],
  migrations: MIGRATION_FILES,
  migrationsRun: false, // Disable automatic migrations - we run them manually
  logging: true, // Enable logging to debug issues
  synchronize: false, // Never use synchronize in production
});
