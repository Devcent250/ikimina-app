import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Teacher } from "./Teacher";
import { TeacherGroup } from "./TeacherGroup";

@Entity("teacher_fines")
export class TeacherFine extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Teacher, (teacher) => teacher.fines)
  @JoinColumn()
  teacher: Teacher;

  @ManyToOne(() => TeacherGroup, (group) => group.fines)
  @JoinColumn()
  teacherGroup: TeacherGroup;

  @Column({ type: "int" })
  fineAmount: number;

  @Column({ type: "date" })
  fineDate: Date;

  @Column({
    type: "enum",
    enum: ["Late Contribution", "Missed Meeting", "Late Payment", "Other"],
    default: "Other",
  })
  fineType: "Late Contribution" | "Missed Meeting" | "Late Payment" | "Other";

  @Column({
    type: "enum",
    enum: ["Pending", "Paid", "Waived"],
    default: "Pending",
  })
  status: "Pending" | "Paid" | "Waived";

  @Column({ nullable: true })
  reason: string;

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
