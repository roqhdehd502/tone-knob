import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

export enum SettlementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ type: 'integer' })
  totalAmount: number; // 정산 총액 (원)

  @Column({ type: 'integer', default: 0 })
  platformFee: number; // 플랫폼 수수료 (원)

  @Column({ type: 'integer' })
  netAmount: number; // 실지급액 (원)

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @Column({ type: 'date' })
  periodStart: Date; // 정산 기간 시작

  @Column({ type: 'date' })
  periodEnd: Date; // 정산 기간 종료

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalTransferId: string; // 외부 송금 ID

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
