import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsOptional, IsString } from 'class-validator';

export class JoinJamRoomDto {
  @ApiPropertyOptional({ description: '비밀번호 (비공개 방인 경우)' })
  @IsString()
  @IsOptional()
  password?: string;
}
