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

import { Tab } from "./tab.entity";

@Entity("collab_sessions")
export class CollabSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "uuid" })
  tabId: string;

  @ManyToOne(() => Tab, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tabId" })
  tab: Tab;

  @Column({ type: "integer", default: 0 })
  revision: number;

  @Column({ type: "jsonb", nullable: true })
  snapshot: Record<string, unknown>;

  @Column({ type: "simple-array", nullable: true })
  activeUserIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
