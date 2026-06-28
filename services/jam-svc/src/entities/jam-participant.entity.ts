import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { JamRoom } from "./jam-room.entity";
import { User } from "./user.entity";

@Entity("jam_participants")
@Index(["roomId", "userId"], { unique: true })
export class JamParticipant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  roomId: string;

  @ManyToOne(() => JamRoom, { onDelete: "CASCADE" })
  @JoinColumn({ name: "roomId" })
  room: JamRoom;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar", length: 100, nullable: true })
  socketId: string;

  @Column({ type: "boolean", default: false })
  isMuted: boolean;

  @Column({ type: "integer", default: 100 })
  volume: number;

  @Column({ type: "boolean", default: true })
  isConnected: boolean;

  @CreateDateColumn()
  joinedAt: Date;
}
