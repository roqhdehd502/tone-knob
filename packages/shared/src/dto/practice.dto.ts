import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class RecordPracticeSessionDto {
  @ApiPropertyOptional({ description: "연습한 타브 ID (특정 타브 없이 자유 연습한 경우 생략)" })
  @IsOptional()
  @IsUUID()
  tabId?: string;

  @ApiProperty({ description: "연습 시간(초)", example: 600, minimum: 1 })
  @IsInt()
  @Min(1)
  durationSeconds: number;

  @ApiPropertyOptional({
    description: "연습 시 사용한 BPM",
    example: 100,
    minimum: 1,
    maximum: 400,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  bpm?: number;

  @ApiPropertyOptional({
    description: "재생 속도 배율 (예: 0.5 = 절반 속도) — 1배 기준 % 정수로 전달",
    example: 100,
    minimum: 10,
    maximum: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(200)
  speedMultiplier?: number;

  @ApiPropertyOptional({ description: "구간 반복 연습 시 시작 마디 번호", example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  loopStartMeasure?: number;

  @ApiPropertyOptional({ description: "구간 반복 연습 시 종료 마디 번호", example: 8, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  loopEndMeasure?: number;
}
