import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsNumber, IsObject, IsOptional, Min } from 'class-validator';

import { PaymentType } from '../../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: '결제 유형', enum: PaymentType })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty({ description: '결제 금액 (원)', example: 3000, minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: '추가 메타데이터 (JSON)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
