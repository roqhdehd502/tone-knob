import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { SettlementService } from './settlement.service';

@Injectable()
export class SettlementAutoRunScheduler {
  private readonly logger = new Logger(SettlementAutoRunScheduler.name);

  constructor(private readonly settlementService: SettlementService) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyAutoSettlement(): Promise<void> {
    const created = await this.settlementService.runMonthlyAutoSettlement();
    if (created.length > 0) {
      this.logger.log(`Auto-created ${created.length} settlement(s) for previous month`);
    }
  }
}
