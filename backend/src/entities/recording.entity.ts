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

import { Tab } from './tab.entity';
import { User } from './user.entity';

export enum RecordingVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
}

@Entity('recordings')
export class Recording {
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

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500 })
  audioUrl: string;

  @Column({ type: 'integer' })
  durationSeconds: number;

  @Column({
    type: 'enum',
    enum: RecordingVisibility,
    default: RecordingVisibility.PUBLIC,
  })
  visibility: RecordingVisibility;

  @Column({ type: 'integer', default: 0 })
  playCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
