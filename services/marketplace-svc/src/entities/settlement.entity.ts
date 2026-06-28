import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./user.entity";

export enum SettlementStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

@Entity("settlements")
export class Settlement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sellerId" })
  seller: User;

  @Column({ type: "integer" })
  totalAmount: number;

  @Column({ type: "integer", default: 0 })
  platformFee: number;

  @Column({ type: "integer" })
  netAmount: number;

  @Column({
    type: "enum",
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @Column({ type: "date" })
  periodStart: Date;

  @Column({ type: "date" })
  periodEnd: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  externalTransferId: string;

  @Column({ type: "text", nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
