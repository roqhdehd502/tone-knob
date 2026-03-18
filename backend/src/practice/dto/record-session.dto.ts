import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class RecordSessionDto {
  @ApiPropertyOptional({ description: '연습한 타브 ID (UUID)' })
  @IsOptional()
  @IsUUID()
  tabId?: string;

  @ApiProperty({ description: '연습 시간 (초)', example: 1800, minimum: 1 })
  @IsInt()
  @Min(1)
  durationSeconds: number;

  @ApiPropertyOptional({ description: 'BPM', example: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  bpm?: number;

  @ApiPropertyOptional({ description: '속도 배율', example: 0.75 })
  @IsOptional()
  @IsNumber()
  speedMultiplier?: number;

  @ApiPropertyOptional({ description: '반복 구간 시작 마디', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  loopStartMeasure?: number;

  @ApiPropertyOptional({ description: '반복 구간 끝 마디', example: 8 })
  @IsOptional()
  @IsInt()
  @Min(0)
  loopEndMeasure?: number;
}
