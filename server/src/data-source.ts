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
dotenv.config();

export const MIGRATION_FILES =
  process.env.NODE_ENV === "development"
    ? ["./src/database/migrations/**/*.ts"]
    : ["./dist/database/migrations/**/*.js"];

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
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
    GroupMember,
    Loan,
    LoanPayment,
    LoanVerification,
    Member,
    PasswordReset,
    PaymentMethod,
    RefreshToken,
    Role,
    Season,
    User,
  ],
  migrations: MIGRATION_FILES,
  migrationsRun: false,
  logging: false,
  synchronize: process.env.NODE_ENV === "development",
});
