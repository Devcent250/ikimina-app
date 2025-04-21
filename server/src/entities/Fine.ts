import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Member } from "./Member";
import { GroupMember } from "./GroupMember";
import { Group } from "./Group";
import { Contribution } from "./Contribution";
import { Loan } from "./Loan";
import { Branch } from "./Branch";
import { User } from "./User";

@Entity("fines")
export class Fine extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, (member) => member.fines)
  @JoinColumn()
  member: Member;

  @ManyToOne(() => GroupMember, (groupMember) => groupMember.fines)
  @JoinColumn()
  groupMember: GroupMember;

  @Column({
    type: "enum",
    enum: ["Late Contribution", "Absenteeism", "Loan Default", "Other"],
    default: "Other",
  })
  reason: "Late Contribution" | "Absenteeism" | "Loan Default" | "Other";

  @Column("int")
  amount: number;

  @ManyToOne(() => Group, (group) => group.fines)
  @JoinColumn()
  group: Group;

  @ManyToOne(() => Contribution, (contribution) => contribution.fines, {
    nullable: true,
  })
  @JoinColumn()
  contribution: Contribution;

  @ManyToOne(() => Branch)
  @JoinColumn()
  branch: Branch;

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @ManyToOne(() => Loan, (loan) => loan.fines, { nullable: true })
  @JoinColumn()
  loan: Loan;

  //notes
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
