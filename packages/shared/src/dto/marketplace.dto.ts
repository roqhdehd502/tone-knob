import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from "class-validator";

import { PaymentType } from "../types/enums";

export class SetTabPriceDto {
  @ApiProperty({ description: "Knob 판매가 (0으로 설정하면 무료 전환)", example: 500, minimum: 0 })
  @IsInt()
  @Min(0)
  price: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: "결제 종류", enum: PaymentType, example: PaymentType.TAB_PURCHASE })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty({ description: "결제 금액 (KRW, 원 단위 정수)", example: 9900, minimum: 0 })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: "PG사 연동에 필요한 부가 정보 (주문명, 상품 ID 등)",
    example: { orderName: "프리미엄 구독" },
    type: "object",
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ConfirmPaymentDto {
  @ApiProperty({
    description: "PG사(토스페이먼츠 등)가 발급한 결제 승인 키",
    example: "tviva20240101000000abcdef",
  })
  @IsString()
  @IsNotEmpty()
  externalPaymentId: string;
}
