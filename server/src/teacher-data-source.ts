import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { School } from "./entities/teacher/School";
import { Teacher } from "./entities/teacher/Teacher";
import { TeacherGroup } from "./entities/teacher/TeacherGroup";
import { TeacherContribution } from "./entities/teacher/TeacherContribution";
import { TeacherLoan } from "./entities/teacher/TeacherLoan";
import { TeacherFine } from "./entities/teacher/TeacherFine";
import { TeacherExpense } from "./entities/teacher/TeacherExpense";
import { TeacherAttendance } from "./entities/teacher/TeacherAttendance";
import { TeacherUser } from "./entities/teacher/TeacherUser";

dotenv.config();

export const TEACHER_MIGRATION_FILES =
  process.env.NODE_ENV === "development"
    ? ["./src/database/teacher-migrations/*.ts"]
    : ["./dist/database/teacher-migrations/*.js"];

export const TeacherDataSource = new DataSource({
  type: "postgres",
  url: process.env.TEACHER_DATABASE_URL,
  entities: [
    School,
    Teacher,
    TeacherGroup,
    TeacherContribution,
    TeacherLoan,
    TeacherFine,
    TeacherExpense,
    TeacherAttendance,
    TeacherUser,
  ],
  migrations: TEACHER_MIGRATION_FILES,
  migrationsRun: true,
  logging: false,
  synchronize: process.env.NODE_ENV === "development",
});
