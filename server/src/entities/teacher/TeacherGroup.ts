import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { School } from "./School";
import { Teacher } from "./Teacher";
import { TeacherContribution } from "./TeacherContribution";
import { TeacherLoan } from "./TeacherLoan";
import { TeacherFine } from "./TeacherFine";
import { TeacherExpense } from "./TeacherExpense";
import { TeacherAttendance } from "./TeacherAttendance";

@Entity("teacher_groups")
export class TeacherGroup extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g., "Kigali Primary School Teachers Savings Group"

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn()
  chairperson: Teacher;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn()
  treasurer: Teacher;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn()
  secretary: Teacher;

  @Column({
    type: "enum",
    enum: ["Weekly", "Bi-weekly", "Monthly"],
    default: "Monthly",
  })
  meetingFrequency: "Weekly" | "Bi-weekly" | "Monthly";

  @Column({
    type: "enum",
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    nullable: true,
  })
  meetingDay: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

  @Column({ type: "time", nullable: true })
  meetingStartTime: string;

  @Column({ type: "time", nullable: true })
  meetingEndTime: string;

  @Column({ nullable: true })
  meetingLocation: string;

  @Column({ type: "int", nullable: true })
  meetingDurationMinutes: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 15.00 })
  defaultContributionPercentage: number; // Default percentage of salary

  @Column({ type: "int", nullable: true })
  minContributionAmount: number; // Minimum contribution amount

  @Column({ type: "int", nullable: true })
  maxContributionAmount: number; // Maximum contribution amount

  @Column({ nullable: true })
  additionalNotes: string;

  @ManyToOne(() => School, (school) => school.teacherGroups)
  @JoinColumn()
  school: School;

  @OneToMany(() => TeacherContribution, (contribution) => contribution.teacherGroup)
  contributions: TeacherContribution[];

  @OneToMany(() => TeacherLoan, (loan) => loan.teacherGroup)
  loans: TeacherLoan[];

  @OneToMany(() => TeacherFine, (fine) => fine.teacherGroup)
  fines: TeacherFine[];

  @OneToMany(() => TeacherExpense, (expense) => expense.teacherGroup)
  expenses: TeacherExpense[];

  @OneToMany(() => TeacherAttendance, (attendance) => attendance.teacherGroup)
  attendance: TeacherAttendance[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
