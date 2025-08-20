import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { GroupMember } from "./GroupMember";
import { Member } from "./Member";
import { Season } from "./Season";
import { User } from "./User";
import { LoanVerification } from "./LoanVerification";
import { Fine } from "./Fine";
import { Group } from "./Group";
import { LoanPayment } from "./LoanPayment";
import { Branch } from "./Branch";

@Entity("loans")
export class Loan extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GroupMember, (groupMember) => groupMember.loans)
  @JoinColumn()
  groupMember: GroupMember;

  @ManyToOne(() => Member, (member) => member.loans)
  @JoinColumn()
  member: Member;

  @Column({ type: "varchar", length: 100, default: "Other" })
  loanType: string;

  // status
  // pending, approved, rejected, completed
  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  status: "pending" | "approved" | "rejected";

  @Column("int")
  amount: number;

  @Column({ nullable: true })
  loanTerms: string;

  @Column("int")
  interestRate: number;

  @Column({
    type: "enum",
    enum: ["Monthly", "Weekly", "Daily"],
    default: "Monthly",
  })
  paymentFrequency: "Monthly" | "Weekly" | "Daily";

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  @ManyToOne(() => Season, (season) => season.loans)
  @JoinColumn()
  season: Season;

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @Column("json", { nullable: true })
  attachments: string[];

  @ManyToOne(() => Group, (group) => group.loans)
  @JoinColumn()
  group: Group;

  @ManyToOne(() => Branch)
  @JoinColumn()
  branch: Branch;

  @OneToMany(() => LoanVerification, (verification) => verification.loan)
  verifications: LoanVerification[];

  @OneToMany(() => LoanPayment, (payment) => payment.loan)
  payments: LoanPayment[];

  @OneToMany(() => Fine, (fine) => fine.loan)
  fines: Fine[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
