import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { RecordingVisibility } from '../../entities/recording.entity';

export class UpdateRecordingDto {
  @ApiPropertyOptional({ description: '녹음 제목', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '녹음 설명', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: '공개 범위', enum: RecordingVisibility })
  @IsOptional()
  @IsEnum(RecordingVisibility)
  visibility?: RecordingVisibility;
}
