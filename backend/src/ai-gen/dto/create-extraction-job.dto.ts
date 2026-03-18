import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateExtractionJobDto {
  @ApiProperty({
    description: '오디오 파일 URL',
    example: 'https://cdn.example.com/song.mp3',
  })
  @IsUrl()
  @IsNotEmpty()
  audioUrl: string;

  @ApiPropertyOptional({
    description: '추출 대상 악기',
    example: 'electric-guitar',
  })
  @IsOptional()
  @IsString()
  instrument?: string;

  @ApiPropertyOptional({ description: '튜닝', example: 'E A D G B E' })
  @IsOptional()
  @IsString()
  tuning?: string;
}
