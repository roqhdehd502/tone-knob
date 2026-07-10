import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, MessagePattern, Payload } from "@nestjs/microservices";
import { SUBSCRIPTION_EVENTS } from "@tone-knob/shared";

import { SubscriptionPlan } from "./entities/subscription.entity";
import { SubscriptionService } from "./subscription/subscription.service";

@Controller()
export class SubscriptionSvcController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    @Inject("COMMUNITY_SERVICE") private readonly communityClient: ClientProxy,
  ) {}

  @MessagePattern("subscription.getPlans")
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  @MessagePattern("subscription.getCurrent")
  async getCurrent(@Payload() data: { userId: string }) {
    return this.subscriptionService.getCurrentSubscription(data.userId);
  }

  @MessagePattern("subscription.subscribe")
  async subscribe(
    @Payload()
    data: {
      userId: string;
      plan: string;
      externalPaymentId?: string;
    },
  ) {
    const subscription = await this.subscriptionService.subscribe(
      data.userId,
      data.plan as SubscriptionPlan,
      data.externalPaymentId,
    );
    this.communityClient.emit(SUBSCRIPTION_EVENTS.ACTIVATED, {
      userId: data.userId,
      plan: subscription.plan,
      subscriptionId: subscription.id,
    });
    return subscription;
  }

  @MessagePattern("subscription.cancel")
  async cancel(@Payload() data: { userId: string }) {
    const subscription = await this.subscriptionService.cancel(data.userId);
    this.communityClient.emit(SUBSCRIPTION_EVENTS.CANCELLED, {
      userId: data.userId,
      plan: subscription.plan,
      subscriptionId: subscription.id,
    });
    return subscription;
  }

  @MessagePattern("subscription.getHistory")
  async getHistory(@Payload() data: { userId: string; page?: number; limit?: number }) {
    return this.subscriptionService.getHistory(data.userId, data.page, data.limit);
  }

  @MessagePattern("subscription.canCreateTab")
  async canCreateTab(@Payload() data: { userId: string }) {
    return this.subscriptionService.canCreateTab(data.userId);
  }
}
