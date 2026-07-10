import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./user.entity";

export enum SubscriptionPlan {
  FREE = "free",
  PREMIUM = "premium",
  PRO = "pro",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

@Entity("subscriptions")
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({
    type: "enum",
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan: SubscriptionPlan;

  @Column({
    type: "enum",
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: "integer", default: 0 })
  priceMonthly: number;

  @Column({ type: "timestamp", nullable: true })
  currentPeriodStart: Date;

  @Column({ type: "timestamp", nullable: true })
  currentPeriodEnd: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  externalPaymentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
