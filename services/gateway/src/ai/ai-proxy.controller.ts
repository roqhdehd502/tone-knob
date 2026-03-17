import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('api/ai-gen')
export class AiProxyController {
  constructor(
    @Inject('AI_SERVICE') private readonly aiClient: ClientProxy,
  ) {}

  @Post('tab')
  async createTabJob(
    @Request() req: { user: { id: string } },
    @Body() body: {
      prompt: string;
      genre?: string;
      instrument?: string;
      difficulty?: string;
      measures?: number;
    },
  ) {
    return firstValueFrom(
      this.aiClient.send('ai.createTabJob', { userId: req.user.id, ...body }),
    );
  }

  @Post('audio-extraction')
  async createExtractionJob(
    @Request() req: { user: { id: string } },
    @Body() body: {
      audioUrl: string;
      instrument?: string;
      tuning?: string;
    },
  ) {
    return firstValueFrom(
      this.aiClient.send('ai.createExtractionJob', { userId: req.user.id, ...body }),
    );
  }

  @Get('jobs')
  async getMyJobs(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.aiClient.send('ai.getMyJobs', {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return firstValueFrom(
      this.aiClient.send('ai.getJob', { jobId: id }),
    );
  }

  @Post('webhook/:id')
  async handleWebhook(
    @Param('id') id: string,
    @Body() body: {
      status: string;
      outputData?: Record<string, unknown>;
      errorMessage?: string;
      progress?: number;
    },
  ) {
    return firstValueFrom(
      this.aiClient.send('ai.webhook', { jobId: id, ...body }),
    );
  }
}
