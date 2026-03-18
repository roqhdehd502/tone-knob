import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateTabJobDto {
  @ApiProperty({
    description: 'AI 생성 프롬프트',
    example: '밝은 분위기의 핑거스타일 기타 인트로',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ description: '장르', example: 'pop' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: '악기', example: 'acoustic-guitar' })
  @IsOptional()
  @IsString()
  instrument?: string;

  @ApiPropertyOptional({ description: '난이도', example: 'intermediate' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    description: '생성할 마디 수',
    example: 16,
    minimum: 1,
    maximum: 64,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(64)
  measures?: number;
}
