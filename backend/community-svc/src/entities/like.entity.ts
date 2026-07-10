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

import { Tab } from "./tab.entity";
import { User } from "./user.entity";

@Entity("likes")
@Unique(["userId", "tabId"])
export class Like {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Index()
  @Column({ type: "uuid" })
  tabId: string;

  @ManyToOne(() => Tab, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tabId" })
  tab: Tab;

  @CreateDateColumn()
  createdAt: Date;
}
