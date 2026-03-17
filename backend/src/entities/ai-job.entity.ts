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

export enum AiJobType {
  TAB_GENERATION = 'tab_generation',
  AUDIO_EXTRACTION = 'audio_extraction',
}

export enum AiJobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('ai_jobs')
export class AiJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: AiJobType })
  type: AiJobType;

  @Column({
    type: 'enum',
    enum: AiJobStatus,
    default: AiJobStatus.QUEUED,
  })
  status: AiJobStatus;

  @Column({ type: 'jsonb' })
  inputData: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  outputData: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'integer', default: 0 })
  progress: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalJobId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
