import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Subscription } from "./entities/subscription.entity";
import { Tab } from "./entities/tab.entity";
import { User } from "./entities/user.entity";
import { SubscriptionModule } from "./subscription/subscription.module";
import { SubscriptionSvcController } from "./subscription-svc.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres" as const,
        url: configService.get<string>("DATABASE_URL"),
        entities: [User, Subscription, Tab],
        synchronize: false,
        logging: configService.get("NODE_ENV") === "development",
      }),
    }),
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
    SubscriptionModule,
  ],
  controllers: [SubscriptionSvcController],
})
export class SubscriptionSvcModule {}
