import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, MessagePattern, Payload } from "@nestjs/microservices";
import { AI_EVENTS } from "@tone-knob/shared";

import { AiGenService } from "./ai-gen/ai-gen.service";
import { AiJobStatus } from "./entities/ai-job.entity";

@Controller()
export class AiSvcController {
  constructor(
    private readonly aiGenService: AiGenService,
    @Inject("COMMUNITY_SERVICE") private readonly communityClient: ClientProxy,
  ) {}

  @MessagePattern("ai.createTabJob")
  async createTabJob(
    @Payload()
    data: {
      userId: string;
      prompt: string;
      genre?: string;
      instrument?: string;
      difficulty?: string;
      measures?: number;
    },
  ) {
    const { userId, ...jobData } = data;
    return this.aiGenService.createTabGenerationJob(userId, jobData);
  }

  @MessagePattern("ai.createExtractionJob")
  async createExtractionJob(
    @Payload()
    data: {
      userId: string;
      audioUrl: string;
      instrument?: string;
      tuning?: string;
    },
  ) {
    const { userId, ...jobData } = data;
    return this.aiGenService.createAudioExtractionJob(userId, jobData);
  }

  @MessagePattern("ai.getJob")
  async getJob(@Payload() data: { jobId: string }) {
    return this.aiGenService.getJob(data.jobId);
  }

  @MessagePattern("ai.getMyJobs")
  async getMyJobs(@Payload() data: { userId: string; page?: number; limit?: number }) {
    return this.aiGenService.getMyJobs(data.userId, data.page, data.limit);
  }

  @MessagePattern("ai.webhook")
  async handleWebhook(
    @Payload()
    data: {
      jobId: string;
      status: AiJobStatus;
      outputData?: Record<string, unknown>;
      errorMessage?: string;
      progress?: number;
    },
  ) {
    const job = await this.aiGenService.handleWebhook(
      data.jobId,
      data.status,
      data.outputData,
      data.errorMessage,
      data.progress,
    );

    if (job.status === AiJobStatus.COMPLETED) {
      this.communityClient.emit(AI_EVENTS.JOB_COMPLETED, {
        jobId: job.id,
        userId: job.userId,
        type: job.type,
        outputData: job.outputData,
      });
    } else if (job.status === AiJobStatus.FAILED) {
      this.communityClient.emit(AI_EVENTS.JOB_FAILED, {
        jobId: job.id,
        userId: job.userId,
        type: job.type,
        errorMessage: job.errorMessage,
      });
    }

    return job;
  }
}
