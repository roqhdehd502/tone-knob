import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { SubscriptionService } from "./subscription/subscription.service";

@Controller()
export class SubscriptionSvcController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

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
    return this.subscriptionService.subscribe(
      data.userId,
      data.plan as any,
      data.externalPaymentId,
    );
  }

  @MessagePattern("subscription.cancel")
  async cancel(@Payload() data: { userId: string }) {
    return this.subscriptionService.cancel(data.userId);
  }

  @MessagePattern("subscription.getHistory")
  async getHistory(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.subscriptionService.getHistory(
      data.userId,
      data.page,
      data.limit,
    );
  }

  @MessagePattern("subscription.canCreateTab")
  async canCreateTab(@Payload() data: { userId: string }) {
    return this.subscriptionService.canCreateTab(data.userId);
  }
}
