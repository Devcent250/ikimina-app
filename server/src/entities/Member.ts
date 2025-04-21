import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Branch } from "./Branch";
import { GroupMember } from "./GroupMember";
import { Contribution } from "./Contribution";
import { Loan } from "./Loan";
import { LoanVerification } from "./LoanVerification";
import { Fine } from "./Fine";

@Entity("members")
export class Member extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  fullNames: string;

  @Column({
    type: "enum",
    enum: ["Male", "Female", "Other"],
    default: "Other",
  })
  gender: "Male" | "Female" | "Other";

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: "enum",
    enum: ["Single", "Married", "Divorced", "Widowed"],
    default: "Single",
  })
  marriageStatus: "Single" | "Married" | "Divorced" | "Widowed";

  @Column({ unique: true })
  idNumber: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  currentAddress: string;

  @Column({ type: "date" })
  joinedAt: Date;

  @Column({})
  sourceOfIncome: string;

  @ManyToOne(() => Branch, (branch) => branch.members)
  @JoinColumn()
  branch: Branch;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.member)
  groupMemberships: GroupMember[];

  @OneToMany(() => Contribution, (contribution) => contribution.member)
  contributions: Contribution[];

  @OneToMany(() => Loan, (loan) => loan.member)
  loans: Loan[];

  @OneToMany(() => LoanVerification, (verification) => verification.member)
  loanVerifications: LoanVerification[];

  @OneToMany(() => Fine, (fine) => fine.member)
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
