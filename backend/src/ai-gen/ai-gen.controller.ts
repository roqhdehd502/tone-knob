import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AiJobStatus } from '../entities/ai-job.entity';
import { AiGenService } from './ai-gen.service';

@ApiTags('ai-gen')
@Controller('api/ai-gen')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AiGenController {
  constructor(private readonly aiGenService: AiGenService) {}

  @Post('tab')
  @ApiOperation({ summary: 'AI 타브 생성 요청' })
  createTabJob(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      prompt: string;
      genre?: string;
      instrument?: string;
      difficulty?: string;
      measures?: number;
    },
  ) {
    return this.aiGenService.createTabGenerationJob(req.user.id, body);
  }

  @Post('audio-extraction')
  @ApiOperation({ summary: '오디오 타브 추출 요청' })
  createExtractionJob(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      audioUrl: string;
      instrument?: string;
      tuning?: string;
    },
  ) {
    return this.aiGenService.createAudioExtractionJob(req.user.id, body);
  }

  @Get('jobs')
  @ApiOperation({ summary: '내 AI 작업 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyJobs(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiGenService.getMyJobs(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'AI 작업 상태 조회' })
  getJob(@Param('id') id: string) {
    return this.aiGenService.getJob(id);
  }

  @Post('webhook/:id')
  @ApiOperation({ summary: 'ML 서버 웹훅 (내부용)' })
  handleWebhook(
    @Param('id') id: string,
    @Body()
    body: {
      status: AiJobStatus;
      outputData?: Record<string, unknown>;
      errorMessage?: string;
      progress?: number;
    },
  ) {
    return this.aiGenService.handleWebhook(
      id,
      body.status,
      body.outputData,
      body.errorMessage,
      body.progress,
    );
  }
}
