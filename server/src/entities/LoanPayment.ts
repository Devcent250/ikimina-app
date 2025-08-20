import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Loan } from "./Loan";
import { PaymentMethod } from "./PaymentMethod";
import { User } from "./User";
import { Group } from "./Group";
import { Season } from "./Season";

@Entity("loan_payments")
export class LoanPayment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Loan, (loan) => loan.payments)
  @JoinColumn()
  loan: Loan;

  @Column({ type: "date" })
  date: Date;

  @Column("decimal", { precision: 15, scale: 2 })
  amount: number;

  @ManyToOne(() => PaymentMethod, (method) => method.loanPayments)
  @JoinColumn()
  paymentMethod: PaymentMethod;

  @ManyToOne(() => User)
  @JoinColumn()
  receivedBy: User;

  @Column({ nullable: true })
  referenceNumber: string;

  @ManyToOne(() => Group)
  @JoinColumn()
  group: Group;

  @ManyToOne(() => Season, (season) => season.loanPayments)
  @JoinColumn()
  season: Season;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
