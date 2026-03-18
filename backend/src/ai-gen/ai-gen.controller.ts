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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AiGenService } from './ai-gen.service';
import { CreateExtractionJobDto } from './dto/create-extraction-job.dto';
import { CreateTabJobDto } from './dto/create-tab-job.dto';
import { WebhookDto } from './dto/webhook.dto';

@ApiTags('ai-gen')
@Controller('api/ai-gen')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AiGenController {
  constructor(private readonly aiGenService: AiGenService) {}

  @Post('tab')
  @ApiOperation({ summary: 'AI 타브 생성 요청' })
  @ApiResponse({ status: 201, description: 'AI 타브 생성 작업 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  createTabJob(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateTabJobDto,
  ) {
    return this.aiGenService.createTabGenerationJob(req.user.id, dto);
  }

  @Post('audio-extraction')
  @ApiOperation({ summary: '오디오 타브 추출 요청' })
  @ApiResponse({ status: 201, description: '오디오 추출 작업 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  createExtractionJob(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateExtractionJobDto,
  ) {
    return this.aiGenService.createAudioExtractionJob(req.user.id, dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: '내 AI 작업 목록' })
  @ApiResponse({ status: 200, description: 'AI 작업 목록 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
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
  @ApiResponse({ status: 200, description: '작업 상태 반환' })
  @ApiResponse({ status: 404, description: '작업을 찾을 수 없음' })
  getJob(@Param('id') id: string) {
    return this.aiGenService.getJob(id);
  }

  @Post('webhook/:id')
  @ApiOperation({ summary: 'ML 서버 웹훅 (내부용)' })
  @ApiResponse({ status: 201, description: '웹훅 처리 성공' })
  handleWebhook(@Param('id') id: string, @Body() dto: WebhookDto) {
    return this.aiGenService.handleWebhook(
      id,
      dto.status,
      dto.outputData,
      dto.errorMessage,
      dto.progress,
    );
  }
}
