import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    BaseEntity,
} from "typeorm";
import { User } from "./User";
import { Branch } from "./Branch";

@Entity("loan_categories")
export class LoanCategory extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 100 })
    name: string;

    @Column({ type: "text" })
    description: string;

    @Column({ type: "int" })
    defaultAmount: number;

    @Column({ type: "decimal", precision: 5, scale: 2 })
    interestRate: number;

    @Column({ type: "int", nullable: true })
    minAmount: number;

    @Column({ type: "int", nullable: true })
    maxAmount: number;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @ManyToOne(() => User)
    @JoinColumn()
    createdBy: User;

    @ManyToOne(() => Branch, { nullable: true, eager: false })
    @JoinColumn({ name: "branchId" })
    branch: Branch;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @Column({
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
    })
    updatedAt: Date;
} 