import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { Season } from "./Season";
import { User } from "./User";
import { ExpenseCategory } from "./ExpenseCategory";
import { PaymentMethod } from "./PaymentMethod";
import { Group } from "./Group";
import { Branch } from "./Branch";

@Entity("expenses")
export class Expense extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  amount: number;

  @Column()
  name: string;

  @Column("json", { nullable: true })
  attachment: string[];

  @ManyToOne(() => Group, (group) => group.expenses)
  @JoinColumn()
  group: Group;

  @ManyToOne(() => Season, (season) => season.expenses)
  @JoinColumn()
  season: Season;

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @ManyToOne(() => Branch)
  @JoinColumn()
  branch: Branch;

  // notes
  @Column({ type: "text", nullable: true })
  notes: string;

  @ManyToOne(() => ExpenseCategory, (category) => category.expenses)
  @JoinColumn()
  expenseCategory: ExpenseCategory;

  @ManyToOne(() => PaymentMethod, (method) => method.expenses)
  @JoinColumn()
  paymentMethod: PaymentMethod;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
