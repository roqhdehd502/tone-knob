import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Tab } from './tab.entity';
import { User } from './user.entity';

@Entity('reviews')
@Unique(['userId', 'tabId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  tabId: string;

  @ManyToOne(() => Tab, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tabId' })
  tab: Tab;

  @Column({ type: 'integer' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
