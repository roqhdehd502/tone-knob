import { Module } from '@nestjs/common';

import { SubscriptionProxyController } from './subscription-proxy.controller';

@Module({
  controllers: [SubscriptionProxyController],
})
export class SubscriptionProxyModule {}
