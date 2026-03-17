import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Tab } from './tab.entity';
import { User } from './user.entity';

export enum PurchaseStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

@Entity('tab_purchases')
@Unique(['buyerId', 'tabId'])
export class TabPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Index()
  @Column({ type: 'uuid' })
  tabId: string;

  @ManyToOne(() => Tab, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tabId' })
  tab: Tab;

  @Column({ type: 'integer' })
  price: number; // 원 단위

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.COMPLETED,
  })
  status: PurchaseStatus;

  @CreateDateColumn()
  createdAt: Date;
}
