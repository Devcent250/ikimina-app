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
import { GroupMember } from "./GroupMember";
import { Season } from "./Season";
import { Group } from "./Group";
import { PaymentMethod } from "./PaymentMethod";
import { User } from "./User";
import { Fine } from "./Fine";
import { Branch } from "./Branch";

@Entity("contributions")
export class Contribution extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Member, (member) => member.contributions)
  @JoinColumn()
  member: Member;

  @ManyToOne(() => GroupMember, (groupMember) => groupMember.contributions)
  @JoinColumn()
  groupMember: GroupMember;

  @ManyToOne(() => Season, (season) => season.contributions)
  @JoinColumn()
  season: Season;

  @Column("int")
  depositAmount: number;

  @Column({
    type: "enum",
    enum: ["solidarity", "saving"],
    default: "saving",
  })
  contributionType: "solidarity" | "saving";

  @Column("int")
  currentSavingAmount: number;

  @Column("int")
  currentSolidalityAmount: number;

  @Column("int")
  beforeSavingAmount: number;

  @Column("int")
  beforeSolidalityAmount: number;

  @ManyToOne(() => Group, (group) => group.contributions)
  @JoinColumn()
  group: Group;

  @ManyToOne(() => PaymentMethod, (method) => method.contributions)
  @JoinColumn()
  paymentMethod: PaymentMethod;

  @ManyToOne(() => Branch)
  @JoinColumn()
  branch: Branch;

  @ManyToOne(() => User)
  @JoinColumn()
  receivedBy: User;

  @OneToMany(() => Fine, (fine) => fine.contribution)
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
