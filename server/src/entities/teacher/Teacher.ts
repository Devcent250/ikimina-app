import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { School } from "./School";
import { TeacherGroup } from "./TeacherGroup";
import { TeacherContribution } from "./TeacherContribution";
import { TeacherLoan } from "./TeacherLoan";
import { TeacherFine } from "./TeacherFine";
import { TeacherAttendance } from "./TeacherAttendance";

@Entity("teachers")
export class Teacher extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  fullName: string;

  @Column({
    type: "enum",
    enum: ["Male", "Female", "Other"],
    default: "Other",
  })
  gender: "Male" | "Female" | "Other";

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true })
  teacherId: string; // School-issued teacher ID

  @Column({ nullable: true })
  subject: string; // e.g., "Mathematics", "English", "Science"

  @Column({ nullable: true })
  gradeLevel: string; // e.g., "Primary 1-3", "Secondary 4-6"

  @Column({ type: "int", nullable: true })
  monthlySalary: number;

  @Column({ type: "int", nullable: true })
  yearsOfExperience: number;

  @Column({
    type: "enum",
    enum: ["Permanent", "Contract", "Part-time", "Substitute"],
    default: "Contract",
  })
  employmentType: "Permanent" | "Contract" | "Part-time" | "Substitute";

  @Column({ type: "date", nullable: true })
  employmentDate: Date;

  @Column({ type: "date", nullable: true })
  joinedSavingsGroupDate: Date;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "boolean", default: false })
  isGroupLeader: boolean;

  @Column({ nullable: true })
  leadershipRole: string; // "Chairperson", "Treasurer", "Secretary"

  @ManyToOne(() => School, (school) => school.teachers)
  @JoinColumn()
  school: School;

  @OneToMany(() => TeacherContribution, (contribution) => contribution.teacher)
  contributions: TeacherContribution[];

  @OneToMany(() => TeacherLoan, (loan) => loan.teacher)
  loans: TeacherLoan[];

  @OneToMany(() => TeacherFine, (fine) => fine.teacher)
  fines: TeacherFine[];

  @OneToMany(() => TeacherAttendance, (attendance) => attendance.teacher)
  attendance: TeacherAttendance[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
