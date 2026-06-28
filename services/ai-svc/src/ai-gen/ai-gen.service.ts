import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { Repository } from 'typeorm';

import { AiJob, AiJobStatus, AiJobType } from '../entities/ai-job.entity';

const ML_DISPATCH_TIMEOUT_MS = 5000;

@Injectable()
export class AiGenService {
  private readonly logger = new Logger(AiGenService.name);

  // ML 서버 엔드포인트 (환경변수로 설정)
  private readonly mlServerUrl: string;
  private readonly gatewayPublicUrl: string;
  private readonly mlWebhookSecret: string | undefined;

  constructor(
    @InjectRepository(AiJob)
    private readonly jobRepository: Repository<AiJob>,
    private readonly configService: ConfigService,
  ) {
    this.mlServerUrl = this.configService.get<string>('ML_SERVER_URL') ?? 'http://localhost:8001';
    this.gatewayPublicUrl =
      this.configService.get<string>('GATEWAY_PUBLIC_URL') ?? 'http://localhost:3000';
    this.mlWebhookSecret = this.configService.get<string>('ML_WEBHOOK_SECRET');
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

  // === ML 서버 디스패치 ===
  // 실제 ML 서버가 설정/응답 가능하면 비동기 작업을 위임하고 webhook으로 결과를 받는다.
  // ML 서버가 없거나 연결에 실패하면(로컬 개발/데모 환경) 더미 결과로 대체한다.

  private async dispatchToMlServer(
    jobId: string,
    type: AiJobType,
    inputData: Record<string, unknown>,
  ): Promise<void> {
    const dispatched = await this.tryDispatchToRealMlServer(jobId, type, inputData);
    if (dispatched) {
      await this.jobRepository.update(jobId, { status: AiJobStatus.PROCESSING });
      return;
    }

    await this.completeWithDummyResult(jobId, type, inputData);
  }

  private async tryDispatchToRealMlServer(
    jobId: string,
    type: AiJobType,
    inputData: Record<string, unknown>,
  ): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_DISPATCH_TIMEOUT_MS);

    try {
      const res = await fetch(`${this.mlServerUrl}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          type,
          inputData,
          webhookUrl: `${this.gatewayPublicUrl}/api/ai-gen/webhook/${jobId}`,
          webhookSecret: this.mlWebhookSecret,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        this.logger.warn(`ML 서버가 ${res.status}로 응답하여 더미 결과로 대체합니다 (job ${jobId})`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `ML 서버(${this.mlServerUrl})에 연결할 수 없어 더미 결과로 대체합니다 (job ${jobId}): ${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
      );
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async completeWithDummyResult(
    jobId: string,
    type: AiJobType,
    inputData: Record<string, unknown>,
  ): Promise<void> {
    try {
      // 데모/로컬 개발용 더미 결과 (실제 ML 서버 미연결 시)
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
