import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ description: '수정할 댓글 내용' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}
