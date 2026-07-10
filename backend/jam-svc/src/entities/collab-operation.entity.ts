import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { CollabSession } from "./collab-session.entity";

export enum OperationType {
  INSERT = "insert",
  DELETE = "delete",
  UPDATE = "update",
  CURSOR = "cursor",
}

@Entity("collab_operations")
@Index(["sessionId", "revision"])
export class CollabOperation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  sessionId: string;

  @ManyToOne(() => CollabSession, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sessionId" })
  session: CollabSession;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "integer" })
  revision: number;

  @Column({ type: "enum", enum: OperationType })
  type: OperationType;

  @Column({ type: "jsonb" })
  payload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
