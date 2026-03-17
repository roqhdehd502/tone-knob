import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '댓글 내용', example: '좋은 타브네요!' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: '부모 댓글 ID (대댓글)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
