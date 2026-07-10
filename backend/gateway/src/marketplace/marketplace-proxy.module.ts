import { Module } from "@nestjs/common";

import { KnobProxyController } from "./knob-proxy.controller";
import { MarketplaceProxyController } from "./marketplace-proxy.controller";
import { PaymentProxyController } from "./payment-proxy.controller";
import { SettlementProxyController } from "./settlement-proxy.controller";

@Module({
  controllers: [
    MarketplaceProxyController,
    PaymentProxyController,
    SettlementProxyController,
    KnobProxyController,
  ],
})
export class MarketplaceProxyModule {}
