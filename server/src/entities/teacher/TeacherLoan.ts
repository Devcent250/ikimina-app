import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Teacher } from "./Teacher";
import { TeacherGroup } from "./TeacherGroup";
import { TeacherLoanPayment } from "./TeacherLoanPayment";

@Entity("teacher_loans")
export class TeacherLoan extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Teacher, (teacher) => teacher.loans)
  @JoinColumn()
  teacher: Teacher;

  @ManyToOne(() => TeacherGroup, (group) => group.loans)
  @JoinColumn()
  teacherGroup: TeacherGroup;

  @Column({ type: "int" })
  loanAmount: number;

  @Column({ type: "int" })
  interestRate: number; // Annual interest rate as percentage

  @Column({ type: "int" })
  loanDurationMonths: number;

  @Column({ type: "int" })
  monthlyPaymentAmount: number; // Calculated monthly payment

  @Column({ type: "date" })
  loanDate: Date;

  @Column({ type: "date" })
  dueDate: Date;

  @Column({
    type: "enum",
    enum: ["Pending", "Approved", "Active", "Completed", "Defaulted"],
    default: "Pending",
  })
  status: "Pending" | "Approved" | "Active" | "Completed" | "Defaulted";

  @Column({ type: "int", default: 0 })
  totalPaid: number;

  @Column({ type: "int", default: 0 })
  remainingBalance: number;

  @Column({ nullable: true })
  purpose: string; // Loan purpose

  @Column({ nullable: true })
  guarantor: string; // Teacher who guarantees the loan

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => TeacherLoanPayment, (payment) => payment.loan)
  payments: TeacherLoanPayment[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
