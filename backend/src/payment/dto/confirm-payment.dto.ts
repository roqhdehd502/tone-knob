import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: '외부 결제 ID (PG사 응답)',
    example: 'pay_abc123',
  })
  @IsString()
  @IsNotEmpty()
  externalPaymentId: string;
}
