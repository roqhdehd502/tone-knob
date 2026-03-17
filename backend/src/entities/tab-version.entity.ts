import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tab } from './tab.entity';
import { User } from './user.entity';

@Entity('tab_versions')
export class TabVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tabId: string;

  @ManyToOne(() => Tab, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tabId' })
  tab: Tab;

  @Column({ type: 'integer' })
  versionNumber: number;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;
}
