import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Teacher } from "./Teacher";
import { TeacherGroup } from "./TeacherGroup";

@Entity("teacher_contributions")
export class TeacherContribution extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Teacher, (teacher) => teacher.contributions)
  @JoinColumn()
  teacher: Teacher;

  @ManyToOne(() => TeacherGroup, (group) => group.contributions)
  @JoinColumn()
  teacherGroup: TeacherGroup;

  @Column({ type: "date" })
  contributionDate: Date;

  @Column({ type: "date" })
  salaryMonth: Date; // Which month's salary this contribution is for

  @Column({ type: "int" })
  salaryAmount: number; // Teacher's salary for that month

  @Column({ type: "decimal", precision: 5, scale: 2 })
  contributionPercentage: number; // e.g., 15.00 for 15%

  @Column({ type: "int" })
  contributionAmount: number; // Calculated: salaryAmount * (contributionPercentage/100)

  @Column({
    type: "enum",
    enum: ["Pending", "Paid", "Late", "Partial"],
    default: "Pending",
  })
  status: "Pending" | "Paid" | "Late" | "Partial";

  @Column({ type: "int", nullable: true })
  actualAmountPaid: number; // Actual amount paid (may differ from calculated)

  @Column({ nullable: true })
  paymentMethod: string; // "Cash", "Bank Transfer", "Mobile Money"

  @Column({ nullable: true })
  receivedBy: string; // Who received the payment

  @Column({ nullable: true })
  notes: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
