import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { RefreshToken } from "./RefreshToken";
import { Role } from "./Role";
import { Branch } from "./Branch";
import { Group } from "./Group";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ unique: false, nullable: true })
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column({ default: "active" })
  status: string;

  @Column({ nullable: true })
  profileUrl: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn()
  role: Role;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: "branchId" })
  branch: Branch;

  @ManyToOne(() => Group)
  @JoinColumn({ name: "groupId" })
  group: Group;

  @Column({ default: false })
  isAdmin: boolean;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    cascade: true,
    eager: false, // Set to true if you want to automatically load refresh tokens with user
  })
  refreshTokens: RefreshToken[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
