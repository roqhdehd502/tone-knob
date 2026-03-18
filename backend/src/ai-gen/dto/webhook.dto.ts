import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { AiJobStatus } from '../../entities/ai-job.entity';

export class WebhookDto {
  @ApiProperty({ description: '작업 상태', enum: AiJobStatus })
  @IsEnum(AiJobStatus)
  status: AiJobStatus;

  @ApiPropertyOptional({ description: '생성 결과 데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  outputData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '에러 메시지' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: '진행률 (0~100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}
