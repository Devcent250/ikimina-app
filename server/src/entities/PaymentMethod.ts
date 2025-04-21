import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BaseEntity,
} from "typeorm";
import { Contribution } from "./Contribution";
import { LoanPayment } from "./LoanPayment";
import { Expense } from "./Expense";

@Entity("payment_methods")
export class PaymentMethod extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  accountNumber: string;

  @OneToMany(() => Contribution, (contribution) => contribution.paymentMethod)
  contributions: Contribution[];

  @OneToMany(() => LoanPayment, (payment) => payment.paymentMethod)
  loanPayments: LoanPayment[];

  @OneToMany(() => Expense, (expense) => expense.paymentMethod)
  expenses: Expense[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
