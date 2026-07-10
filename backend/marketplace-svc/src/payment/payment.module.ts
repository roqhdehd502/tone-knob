import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Payment } from "../entities/payment.entity";
import { PaymentService } from "./payment.service";
import { PortoneService } from "./portone.service";

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [PaymentService, PortoneService],
  exports: [PaymentService, PortoneService],
})
export class PaymentModule {}
