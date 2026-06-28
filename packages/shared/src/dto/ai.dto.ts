import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { TabDifficulty } from '../types/enums';

export class CreateAiTabJobDto {
  @ApiProperty({
    description: 'AI에게 전달할 곡 설명/요청 사항',
    example: '슬픈 발라드 느낌의 어쿠스틱 기타 연주곡',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt: string;

  @ApiPropertyOptional({ description: '장르', example: '발라드', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  genre?: string;

  @ApiPropertyOptional({ description: '악기', example: '기타', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  instrument?: string;

  @ApiPropertyOptional({ description: '난이도', enum: TabDifficulty, example: TabDifficulty.INTERMEDIATE })
  @IsOptional()
  @IsEnum(TabDifficulty)
  difficulty?: TabDifficulty;

  @ApiPropertyOptional({ description: '생성할 마디 수', example: 16, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  measures?: number;
}

export class CreateAudioExtractionJobDto {
  @ApiProperty({ description: '추출할 오디오 파일의 URL (Storage 업로드 후 받은 URL)', example: 'https://xxxx.supabase.co/storage/v1/object/public/media/song.mp3' })
  @IsUrl()
  audioUrl: string;

  @ApiPropertyOptional({ description: '악기', example: '베이스', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  instrument?: string;

  @ApiPropertyOptional({ description: '튜닝 (예: standard, drop-d, half-step-down)', example: 'standard', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tuning?: string;
}

export class AiWebhookDto {
  @ApiProperty({ description: 'ML 서버가 보고하는 작업 상태', example: 'completed' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({
    description: '작업 완료 시 결과 데이터 (생성된 타브 본문 등)',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  outputData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '작업 실패 시 에러 메시지', example: 'ML 서버 처리 중 타임아웃' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({ description: '진행률 (0~100)', example: 50, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}
