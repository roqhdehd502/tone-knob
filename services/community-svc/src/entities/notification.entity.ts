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

export enum NotificationType {
  LIKE = "like",
  COMMENT = "comment",
  REPLY = "reply",
  FOLLOW = "follow",
  JAM_INVITE = "jam_invite",
  PURCHASE = "purchase",
  PAYMENT = "payment",
  AI_JOB = "ai_job",
  TAB_FORKED = "tab_forked",
  TAB_PUBLISHED = "tab_published",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  recipientId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recipientId" })
  recipient: User;

  @Column({ type: "uuid" })
  actorId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "actorId" })
  actor: User;

  @Column({ type: "enum", enum: NotificationType })
  type: NotificationType;

  @Column({ type: "uuid", nullable: true })
  referenceId: string | null;

  @Column({ type: "varchar", length: 500 })
  message: string;

  @Index()
  @Column({ type: "boolean", default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
