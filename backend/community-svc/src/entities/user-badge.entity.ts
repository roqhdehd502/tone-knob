import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { Badge } from "./badge.entity";
import { User } from "./user.entity";

@Entity("user_badges")
@Unique(["userId", "badgeId"])
export class UserBadge {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "uuid" })
  badgeId: string;

  @ManyToOne(() => Badge, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "badgeId" })
  badge: Badge;

  @Column({ type: "boolean", default: false })
  isFeatured: boolean;

  @CreateDateColumn()
  earnedAt: Date;
}
