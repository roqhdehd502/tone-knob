import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTabDto {
  @ApiPropertyOptional({ description: '타브 제목', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '아티스트명', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  artist?: string;

  @ApiPropertyOptional({ description: '타브 콘텐츠 (TabDocument JSON)' })
  @IsObject()
  @IsOptional()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '공개 여부' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '변경 설명', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeDescription?: string;
}
