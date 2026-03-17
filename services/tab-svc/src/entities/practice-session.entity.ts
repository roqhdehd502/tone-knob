import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tab } from './tab.entity';
import { User } from './user.entity';

@Entity('practice_sessions')
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  tabId: string;

  @ManyToOne(() => Tab, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tabId' })
  tab: Tab;

  @Column({ type: 'integer' })
  durationSeconds: number;

  @Column({ type: 'integer', nullable: true })
  bpm: number;

  @Column({ type: 'float', nullable: true })
  speedMultiplier: number;

  @Column({ type: 'integer', nullable: true })
  loopStartMeasure: number;

  @Column({ type: 'integer', nullable: true })
  loopEndMeasure: number;

  @CreateDateColumn()
  createdAt: Date;
}
