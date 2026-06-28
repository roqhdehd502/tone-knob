import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SUBSCRIPTION_EVENTS } from "@tone-knob/shared";

import { SubscriptionService } from "./subscription.service";

@Injectable()
export class SubscriptionExpiryScheduler {
  private readonly logger = new Logger(SubscriptionExpiryScheduler.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    @Inject("COMMUNITY_SERVICE") private readonly communityClient: ClientProxy,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiry(): Promise<void> {
    const expired = await this.subscriptionService.expireOverdueSubscriptions();
    if (expired.length === 0) return;

    this.logger.log(`Expired ${expired.length} subscription(s)`);
    for (const subscription of expired) {
      this.communityClient.emit(SUBSCRIPTION_EVENTS.EXPIRED, {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        plan: subscription.plan,
      });
    }
  }
}
