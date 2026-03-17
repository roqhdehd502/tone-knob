import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { Repository } from 'typeorm';

import { AiJob, AiJobStatus, AiJobType } from '../entities/ai-job.entity';

@Injectable()
export class AiGenService {
  // ML 서버 엔드포인트 (환경변수로 설정)
  private readonly mlServerUrl: string;

  constructor(
    @InjectRepository(AiJob)
    private readonly jobRepository: Repository<AiJob>,
    private readonly configService: ConfigService,
  ) {
    this.mlServerUrl = this.configService.get<string>('ML_SERVER_URL') ?? 'http://localhost:8001';
  }

  // === AI 타브 생성 ===

  async createTabGenerationJob(
    userId: string,
    data: {
      prompt: string;
      genre?: string;
      instrument?: string;
      difficulty?: string;
      measures?: number;
    },
  ): Promise<AiJob> {
    const job = this.jobRepository.create({
      userId,
      type: AiJobType.TAB_GENERATION,
      status: AiJobStatus.QUEUED,
      inputData: data,
    });
    const saved = await this.jobRepository.save(job);

    // ML 서버에 비동기 작업 요청 (실제 연동 시 HTTP 호출)
    void this.dispatchToMlServer(saved.id, AiJobType.TAB_GENERATION, data);

    return saved;
  }

  // === 오디오 → 타브 추출 ===

  async createAudioExtractionJob(
    userId: string,
    data: {
      audioUrl: string;
      instrument?: string;
      tuning?: string;
    },
  ): Promise<AiJob> {
    const job = this.jobRepository.create({
      userId,
      type: AiJobType.AUDIO_EXTRACTION,
      status: AiJobStatus.QUEUED,
      inputData: data,
    });
    const saved = await this.jobRepository.save(job);

    void this.dispatchToMlServer(saved.id, AiJobType.AUDIO_EXTRACTION, data);

    return saved;
  }

  // === 작업 조회 ===

  async getJob(jobId: string): Promise<AiJob> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) throw new RpcException(new NotFoundException('AI 작업을 찾을 수 없습니다'));
    return job;
  }

  async getMyJobs(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: AiJob[]; total: number }> {
    const [data, total] = await this.jobRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  // === ML 서버 웹훅 (결과 수신) ===

  async handleWebhook(
    jobId: string,
    status: AiJobStatus,
    outputData?: Record<string, unknown>,
    errorMessage?: string,
    progress?: number,
  ): Promise<AiJob> {
    const job = await this.getJob(jobId);
    job.status = status;
    if (outputData) job.outputData = outputData;
    if (errorMessage) job.errorMessage = errorMessage;
    if (progress !== undefined) job.progress = progress;
    return this.jobRepository.save(job);
  }

  // === ML 서버 디스패치 (스텁) ===

  private async dispatchToMlServer(
    jobId: string,
    type: AiJobType,
    inputData: Record<string, unknown>,
  ): Promise<void> {
    try {
      // 실제 ML 서버 연동 시 아래 주석 해제
      // await fetch(`${this.mlServerUrl}/jobs`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ jobId, type, inputData }),
      // });

      // 스텁: 3초 후 더미 결과로 완료 처리
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const dummyOutput =
        type === AiJobType.TAB_GENERATION
          ? {
              title: `AI Generated Tab (${(typeof inputData.prompt === 'string' ? inputData.prompt : '').slice(0, 20)})`,
              content: '{"measures": [], "tempo": 120}',
              instrument: inputData.instrument ?? 'guitar',
            }
          : {
              title: 'Extracted Tab',
              content: '{"measures": [], "tempo": 100}',
              confidence: 0.85,
            };

      await this.jobRepository.update(jobId, {
        status: AiJobStatus.COMPLETED,
        outputData: dummyOutput,
        progress: 100,
      });
    } catch (err) {
      await this.jobRepository.update(jobId, {
        status: AiJobStatus.FAILED,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
}
