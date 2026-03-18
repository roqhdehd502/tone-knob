import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

import { SettlementStatus } from '../../entities/settlement.entity';

export class UpdateSettlementStatusDto {
  @ApiProperty({ description: '변경할 정산 상태', enum: SettlementStatus })
  @IsEnum(SettlementStatus)
  status: SettlementStatus;

  @ApiPropertyOptional({ description: '외부 이체 ID' })
  @IsOptional()
  @IsString()
  externalTransferId?: string;
}
