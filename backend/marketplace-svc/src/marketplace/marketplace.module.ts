import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Tab } from "../entities/tab.entity";
import { TabPurchase } from "../entities/tab-purchase.entity";
import { KnobModule } from "../knob/knob.module";
import { MarketplaceService } from "./marketplace.service";

@Module({
  imports: [TypeOrmModule.forFeature([Tab, TabPurchase]), KnobModule],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
