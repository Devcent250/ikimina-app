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
import { Member } from "./Member";
import { GroupMember } from "./GroupMember";
import { Contribution } from "./Contribution";
import { Loan } from "./Loan";
import { Fine } from "./Fine";
import { Attendance } from "./Attendance";
import { Expense } from "./Expense";

@Entity("groups")
export class Group extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn()
  president: Member;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn()
  accountant: Member;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn()
  secretary: Member;

  @Column({
    type: "enum",
    enum: ["Weekly", "Bi-weekly", "Monthly", "Quarterly"],
    default: "Monthly",
  })
  meetingFrequency: "Weekly" | "Bi-weekly" | "Monthly" | "Quarterly";

  @Column({ nullable: true })
  location: string;

  @Column("int")
  pricePerShare: number;

  @Column("int")
  minShares: number;

  @Column("int")
  maxShares: number;

  // solidarity fund
  @Column("int")
  solidarityAmount: number;

  @ManyToOne(() => Branch, (branch) => branch.groups)
  @JoinColumn()
  branch: Branch;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.group)
  groupMembers: GroupMember[];

  @OneToMany(() => Contribution, (contribution) => contribution.group)
  contributions: Contribution[];

  @OneToMany(() => Loan, (loan) => loan.group)
  loans: Loan[];

  @OneToMany(() => Fine, (fine) => fine.group)
  fines: Fine[];

  @OneToMany(() => Attendance, (attendance) => attendance.group)
  attendances: Attendance[];

  @OneToMany(() => Expense, (expense) => expense.group)
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
