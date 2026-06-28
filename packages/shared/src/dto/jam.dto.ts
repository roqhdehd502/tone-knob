import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateJamRoomDto {
  @ApiProperty({ description: "합주방 이름", example: "저녁 합주 모임", maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: "합주방 설명",
    example: "편하게 합주하실 분 구해요",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: "함께 연습할 타브 ID (선택)" })
  @IsOptional()
  @IsUUID()
  tabId?: string;

  @ApiPropertyOptional({
    description: "최대 참가자 수 (기본값 4)",
    example: 4,
    minimum: 2,
    maximum: 10,
    default: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(10)
  maxParticipants?: number;

  @ApiPropertyOptional({
    description: "비공개방 여부 (true면 password 필요, 기본값 false)",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: "비공개방 입장 비밀번호 (isPrivate=true일 때 사용)",
    example: "jam1234",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  password?: string;

  @ApiPropertyOptional({
    description: "합주 BPM (기본값 120)",
    example: 120,
    minimum: 20,
    maximum: 300,
    default: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(300)
  bpm?: number;
}

export class JoinJamRoomDto {
  @ApiPropertyOptional({
    description: "비공개방 입장 비밀번호 (공개방은 불필요)",
    example: "jam1234",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  password?: string;
}
