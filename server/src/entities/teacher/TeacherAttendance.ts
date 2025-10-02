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

@Entity("teacher_attendance")
export class TeacherAttendance extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Teacher, (teacher) => teacher.attendance)
  @JoinColumn()
  teacher: Teacher;

  @ManyToOne(() => TeacherGroup, (group) => group.attendance)
  @JoinColumn()
  teacherGroup: TeacherGroup;

  @Column({ type: "date" })
  meetingDate: Date;

  @Column({
    type: "enum",
    enum: ["Present", "Absent", "Late", "Excused"],
    default: "Present",
  })
  attendanceStatus: "Present" | "Absent" | "Late" | "Excused";

  @Column({ nullable: true })
  excuseReason: string;

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
