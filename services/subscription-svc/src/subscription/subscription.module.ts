import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Subscription } from "../entities/subscription.entity";
import { Tab } from "../entities/tab.entity";
import { User } from "../entities/user.entity";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionExpiryScheduler } from "./subscription-expiry.scheduler";

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
      // 구독 결제 검증 시 marketplace-svc의 결제 레코드를 서버 측에서 재조회하기 위한 클라이언트.
      {
        name: "MARKETPLACE_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get("MARKETPLACE_SVC_HOST", "localhost"),
            port: parseInt(configService.get("MARKETPLACE_SVC_PORT", "3006"), 10),
          },
        }),
      },
    ]),
  ],
  providers: [SubscriptionService, SubscriptionExpiryScheduler],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
