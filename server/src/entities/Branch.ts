import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Group } from "./Group";
import { Member } from "./Member";
import { GroupMember } from "./GroupMember";
import { District } from "./District";

@Entity("branches")
export class Branch extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => District, (district) => district.branches)
  @JoinColumn()
  district: District;

  @ManyToOne(() => User)
  users: User[];

  @OneToMany(() => Group, (group) => group.branch)
  groups: Group[];

  @OneToMany(() => Member, (member) => member.branch)
  members: Member[];

  @OneToMany(() => GroupMember, (groupMember) => groupMember.branch)
  groupMembers: GroupMember[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
