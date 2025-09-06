import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    BaseEntity,
  } from "typeorm";
  import { Branch } from "./Branch";
  
  @Entity("districts")
  export class District extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ unique: true })
    name: string;
  
    @Column({ nullable: true })
    description: string;
  
    @Column({ nullable: true })
    location: string;
  
    @OneToMany(() => Branch, (branch) => branch.district)
    branches: Branch[];
  
    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;
  
    @Column({
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    })
    updatedAt: Date;
  }   