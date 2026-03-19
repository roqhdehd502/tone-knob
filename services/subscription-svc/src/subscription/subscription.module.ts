import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Subscription } from "../entities/subscription.entity";
import { Tab } from "../entities/tab.entity";
import { User } from "../entities/user.entity";
import { SubscriptionService } from "./subscription.service";

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, User, Tab])],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
