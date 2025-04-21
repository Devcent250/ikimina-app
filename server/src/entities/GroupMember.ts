import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Member } from "./Member";
import { Group } from "./Group";
import { Branch } from "./Branch";
import { Contribution } from "./Contribution";
import { Loan } from "./Loan";
import { LoanVerification } from "./LoanVerification";
import { Fine } from "./Fine";

@Entity("group_members")
export class GroupMember extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, (member) => member.groupMemberships)
  @JoinColumn()
  member: Member;

  @ManyToOne(() => Group, (group) => group.groupMembers)
  @JoinColumn()
  group: Group;

  @Column({ default: false })
  loanEligibility: boolean;

  @ManyToOne(() => Branch, (branch) => branch.groupMembers)
  @JoinColumn()
  branch: Branch;

  @Column("int", { default: 0 })
  numberOfShares: number;

  @OneToMany(() => Contribution, (contribution) => contribution.groupMember)
  contributions: Contribution[];

  @OneToMany(() => Loan, (loan) => loan.groupMember)
  loans: Loan[];

  @OneToMany(() => LoanVerification, (verification) => verification.groupMember)
  loanVerifications: LoanVerification[];

  @OneToMany(() => Fine, (fine) => fine.groupMember)
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
