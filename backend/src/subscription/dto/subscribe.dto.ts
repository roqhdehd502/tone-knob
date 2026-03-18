import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

import { SubscriptionPlan } from '../../entities/subscription.entity';

export class SubscribeDto {
  @ApiProperty({
    description: '구독 플랜',
    enum: SubscriptionPlan,
    example: 'pro',
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional({ description: '외부 결제 ID' })
  @IsOptional()
  @IsString()
  externalPaymentId?: string;
}
