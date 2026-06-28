import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Settlement } from '../entities/settlement.entity';
import { TabPurchase } from '../entities/tab-purchase.entity';
import { SettlementAutoRunScheduler } from './settlement-auto-run.scheduler';
import { SettlementService } from './settlement.service';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement, TabPurchase])],
  providers: [SettlementService, SettlementAutoRunScheduler],
  exports: [SettlementService],
})
export class SettlementModule {}
