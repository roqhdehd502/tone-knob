import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { SubscriptionTier } from '../types/enums';

export class SubscribeDto {
  @ApiProperty({
    description: '구독할 플랜 (free는 구독 신청 대상이 아님 — 기본값)',
    enum: SubscriptionTier,
    example: SubscriptionTier.PREMIUM,
  })
  @IsEnum(SubscriptionTier)
  plan: SubscriptionTier;

  @ApiPropertyOptional({ description: 'PG사 결제 승인 키 (사전 결제 완료 후 전달)', example: 'tviva20240101000000abcdef' })
  @IsOptional()
  @IsString()
  externalPaymentId?: string;
}
