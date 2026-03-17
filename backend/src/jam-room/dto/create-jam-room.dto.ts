import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJamRoomDto {
  @ApiProperty({ description: '합주방 이름', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '합주방 설명' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '타브 ID' })
  @IsUUID()
  @IsOptional()
  tabId?: string;

  @ApiPropertyOptional({
    description: '최대 참가자 수',
    default: 4,
    minimum: 2,
    maximum: 10,
  })
  @IsInt()
  @Min(2)
  @Max(10)
  @IsOptional()
  maxParticipants?: number;

  @ApiPropertyOptional({ description: '비공개 여부', default: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: '비밀번호 (비공개 시)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  password?: string;

  @ApiPropertyOptional({
    description: 'BPM',
    default: 120,
    minimum: 40,
    maximum: 300,
  })
  @IsInt()
  @Min(40)
  @Max(300)
  @IsOptional()
  bpm?: number;
}
