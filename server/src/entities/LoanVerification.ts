import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Loan } from "./Loan";
import { Member } from "./Member";

@Entity("loan_verifications")
export class LoanVerification extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Loan, (loan) => loan.verifications)
  @JoinColumn()
  loan: Loan;

  @ManyToOne(() => Member, (member) => member.loanVerifications)
  @JoinColumn()
  member: Member;



  @Column({ nullable: true })
  notes: string;

  @Column({
    type: "enum",
    enum: ["Approved", "Rejected"],
    default: "Approved",
  })
  status: "Approved" | "Rejected";

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
