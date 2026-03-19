import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

export enum KnobTransactionType {
  EARN_TAB_CREATED = 'earn_tab_created',
  EARN_JAM_PARTICIPATED = 'earn_jam_participated',
  EARN_COMMUNITY_ACTIVITY = 'earn_community_activity',
  EARN_DAILY_LOGIN = 'earn_daily_login',
  EARN_TAB_SALE = 'earn_tab_sale',
  SPEND_TAB_PURCHASE = 'spend_tab_purchase',
  SPEND_PREMIUM_FEATURE = 'spend_premium_feature',
}

@Entity('knob_transactions')
export class KnobTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: KnobTransactionType })
  type: KnobTransactionType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int' })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  referenceId: string;

  @CreateDateColumn()
  createdAt: Date;
}
