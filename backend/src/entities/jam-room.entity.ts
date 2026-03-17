import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('jam_rooms')
export class JamRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  hostId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hostId' })
  host: User;

  @Column({ type: 'uuid', nullable: true })
  tabId: string;

  @Column({ type: 'integer', default: 4 })
  maxParticipants: number;

  @Column({ type: 'integer', default: 0 })
  currentParticipants: number;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  password: string;

  @Column({ type: 'integer', default: 120 })
  bpm: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
