import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BaseEntity,
} from "typeorm";
import { Contribution } from "./Contribution";
import { Loan } from "./Loan";
import { Expense } from "./Expense";
import { LoanPayment } from "./LoanPayment";

@Entity("seasons")
export class Season extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: "date" })
  start: Date;

  @Column({ type: "date" })
  end: Date;

  @Column({
    type: "enum",
    enum: ["active", "completed"],
    default: "active",
  })
  status: "active" | "completed";

  @OneToMany(() => Contribution, (contribution) => contribution.season)
  contributions: Contribution[];

  @OneToMany(() => Loan, (loan) => loan.season)
  loans: Loan[];

  @OneToMany(() => Expense, (expense) => expense.season)
  expenses: Expense[];

  @OneToMany(() => LoanPayment, (payment) => payment.season)
  loanPayments: LoanPayment[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
