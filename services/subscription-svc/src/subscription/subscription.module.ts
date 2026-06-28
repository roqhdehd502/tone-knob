import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Subscription } from "../entities/subscription.entity";
import { Tab } from "../entities/tab.entity";
import { User } from "../entities/user.entity";
import { SubscriptionExpiryScheduler } from "./subscription-expiry.scheduler";
import { SubscriptionService } from "./subscription.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User, Tab]),
    // 만료 처리 시 community-svc에 emit하기 위한 클라이언트.
    ClientsModule.registerAsync([
      {
        name: "COMMUNITY_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get("COMMUNITY_SVC_HOST", "localhost"),
            port: parseInt(configService.get("COMMUNITY_SVC_PORT", "3005"), 10),
          },
        }),
      },
    ]),
  ],
  providers: [SubscriptionService, SubscriptionExpiryScheduler],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
