import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTabDto {
  @ApiProperty({ description: '타브 제목', maxLength: 200, example: 'My Tab' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '아티스트명', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  artist?: string;

  @ApiProperty({ description: '타브 콘텐츠 (TabDocument JSON)' })
  @IsObject()
  @IsNotEmpty()
  content: Record<string, unknown>;

  @ApiPropertyOptional({ description: '공개 여부', default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
