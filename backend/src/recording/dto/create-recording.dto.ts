import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { RecordingVisibility } from '../../entities/recording.entity';

export class CreateRecordingDto {
  @ApiProperty({ description: '녹음 제목', example: '첫 녹음' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '녹음 설명' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: '오디오 파일 URL',
    example: 'https://cdn.example.com/audio.mp3',
  })
  @IsUrl()
  @IsNotEmpty()
  audioUrl: string;

  @ApiProperty({ description: '녹음 길이 (초)', example: 180, minimum: 1 })
  @IsInt()
  @Min(1)
  durationSeconds: number;

  @ApiPropertyOptional({ description: '관련 타브 ID (UUID)' })
  @IsOptional()
  @IsUUID()
  tabId?: string;

  @ApiPropertyOptional({
    description: '공개 범위',
    enum: RecordingVisibility,
    default: RecordingVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(RecordingVisibility)
  visibility?: RecordingVisibility;
}
