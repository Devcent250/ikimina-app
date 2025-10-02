import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BaseEntity,
} from "typeorm";
import { Teacher } from "./Teacher";
import { TeacherGroup } from "./TeacherGroup";

@Entity("schools")
export class School extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  district: string;

  @Column({
    type: "enum",
    enum: ["Primary", "Secondary", "University", "Vocational"],
    default: "Primary",
  })
  educationLevel: "Primary" | "Secondary" | "University" | "Vocational";

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @OneToMany(() => Teacher, (teacher) => teacher.school)
  teachers: Teacher[];

  @OneToMany(() => TeacherGroup, (group) => group.school)
  teacherGroups: TeacherGroup[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
