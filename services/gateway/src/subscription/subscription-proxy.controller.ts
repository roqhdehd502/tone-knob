import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Request,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Controller("api/subscriptions")
export class SubscriptionProxyController {
  constructor(
    @Inject("SUBSCRIPTION_SERVICE")
    private readonly subscriptionClient: ClientProxy,
  ) {}

  @Get("plans")
  async getPlans() {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.getPlans", {}),
    );
  }

  @Get("current")
  async getCurrent(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.getCurrent", {
        userId: req.user.id,
      }),
    );
  }

  @Post("subscribe")
  async subscribe(
    @Request() req: { user: { id: string } },
    @Body() body: { plan: string; externalPaymentId?: string },
  ) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.subscribe", {
        userId: req.user.id,
        plan: body.plan,
        externalPaymentId: body.externalPaymentId,
      }),
    );
  }

  @Post("cancel")
  async cancel(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.cancel", {
        userId: req.user.id,
      }),
    );
  }

  @Get("history")
  async getHistory(
    @Request() req: { user: { id: string } },
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.getHistory", {
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get("tab-limit")
  async canCreateTab(@Request() req: { user: { id: string } }) {
    return firstValueFrom(
      this.subscriptionClient.send("subscription.canCreateTab", {
        userId: req.user.id,
      }),
    );
  }
}
