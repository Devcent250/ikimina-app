import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { TeacherLoan } from "./TeacherLoan";

@Entity("teacher_loan_payments")
export class TeacherLoanPayment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TeacherLoan, (loan) => loan.payments)
  @JoinColumn()
  loan: TeacherLoan;

  @Column({ type: "int" })
  paymentAmount: number;

  @Column({ type: "date" })
  paymentDate: Date;

  @Column({
    type: "enum",
    enum: ["Principal", "Interest", "Both"],
    default: "Both",
  })
  paymentType: "Principal" | "Interest" | "Both";

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  receivedBy: string;

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
