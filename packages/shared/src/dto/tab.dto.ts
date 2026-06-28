import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateTabDto {
  @ApiProperty({ description: "타브 제목", example: "Wonderwall", maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: "아티스트/곡 원작자명", example: "Oasis", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  artist?: string;

  @ApiProperty({
    description: "타브 악보 본문 (에디터가 생성하는 JSON 구조 — 마디/프렛/박자 등을 포함)",
    example: { measures: [], tempo: 120, timeSignature: "4/4" },
    type: "object",
    additionalProperties: true,
  })
  @IsObject()
  @IsNotEmpty()
  content: Record<string, unknown>;

  @ApiPropertyOptional({ description: "공개 여부 (기본값 false)", example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: "Knob 판매가 (0이면 무료, 마켓플레이스 등록 시 사용)",
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class UpdateTabDto {
  @ApiPropertyOptional({
    description: "타브 제목",
    example: "Wonderwall (Acoustic)",
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: "아티스트/곡 원작자명", example: "Oasis", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  artist?: string;

  @ApiPropertyOptional({
    description: "타브 악보 본문 (전달 시 전체 교체됨)",
    example: { measures: [], tempo: 120, timeSignature: "4/4" },
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "공개 여부", example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: "Knob 판매가 (0이면 무료)", example: 0, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export interface TabAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface TabResponse {
  id: string;
  user: TabAuthor;
  title: string;
  artist: string | null;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  price: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TabDetailResponse extends TabResponse {
  content: Record<string, unknown>;
}
