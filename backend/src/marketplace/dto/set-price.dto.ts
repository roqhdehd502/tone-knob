import { ApiProperty } from '@nestjs/swagger';

import { IsNumber, Min } from 'class-validator';

export class SetPriceDto {
  @ApiProperty({
    description: '타브 판매 가격 (원)',
    example: 3000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;
}
