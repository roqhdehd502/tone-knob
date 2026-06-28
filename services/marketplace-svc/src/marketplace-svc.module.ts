import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

import { KnobTransaction } from "./entities/knob-transaction.entity";
import { Payment } from "./entities/payment.entity";
import { Settlement } from "./entities/settlement.entity";
import { Tab } from "./entities/tab.entity";
import { TabPurchase } from "./entities/tab-purchase.entity";
import { User } from "./entities/user.entity";

import { KnobModule } from "./knob/knob.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { PaymentModule } from "./payment/payment.module";
import { SettlementModule } from "./settlement/settlement.module";
import { MarketplaceSvcController } from "./marketplace-svc.controller";
import { EventHandlerController } from "./events/event-handler.controller";

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
        entities: [
          User,
          Tab,
          TabPurchase,
          Payment,
          Settlement,
          KnobTransaction,
        ],
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
            host:
              configService.get<string>("COMMUNITY_SVC_HOST") ?? "localhost",
            port: parseInt(
              configService.get<string>("COMMUNITY_SVC_PORT") ?? "3005",
              10,
            ),
          },
        }),
      },
    ]),
    KnobModule,
    MarketplaceModule,
    PaymentModule,
    SettlementModule,
  ],
  controllers: [MarketplaceSvcController, EventHandlerController],
})
export class MarketplaceSvcModule {}
