import { Module } from '@nestjs/common';

import { CommunityProxyController } from './community-proxy.controller';
import { NotificationProxyController } from './notification-proxy.controller';
import { ReviewProxyController } from './review-proxy.controller';

@Module({
  controllers: [CommunityProxyController, NotificationProxyController, ReviewProxyController],
})
export class CommunityProxyModule {}
