import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { TeacherGroup } from "./TeacherGroup";

@Entity("teacher_expenses")
export class TeacherExpense extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TeacherGroup, (group) => group.expenses)
  @JoinColumn()
  teacherGroup: TeacherGroup;

  @Column()
  expenseDescription: string;

  @Column({ type: "int" })
  expenseAmount: number;

  @Column({ type: "date" })
  expenseDate: Date;

  @Column({
    type: "enum",
    enum: ["Meeting", "Administrative", "Social", "Emergency", "Other"],
    default: "Other",
  })
  expenseCategory: "Meeting" | "Administrative" | "Social" | "Emergency" | "Other";

  @Column({ nullable: true })
  paidBy: string; // Teacher who paid

  @Column({ nullable: true })
  approvedBy: string; // Group leader who approved

  @Column({ nullable: true })
  receiptNumber: string;

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
