import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class ToCdnUrlDto {
  @ApiProperty({ description: '원본(Origin) Storage URL — CDN URL로 변환할 대상', example: 'https://xxxx.supabase.co/storage/v1/object/public/media/foo.mp3' })
  @IsUrl()
  url: string;
}

export class ToOriginUrlDto {
  @ApiProperty({ description: 'CDN URL — 원본(Origin) Storage URL로 변환할 대상', example: 'https://cdn.toneknob.com/media/foo.mp3' })
  @IsUrl()
  url: string;
}

export class GetSignedUrlDto {
  @ApiProperty({ description: 'Storage 버킷 내 파일 경로', example: 'users/abc-123/recording.mp3' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ description: '서명된 URL 만료 시간(초), 기본값은 서비스 설정값 사용', example: 3600, minimum: 1, maximum: 604800 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(604800)
  expiresInSeconds?: number;
}
