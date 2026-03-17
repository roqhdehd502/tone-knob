import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Follow } from "./entities/follow.entity";
import { PracticeSession } from "./entities/practice-session.entity";
import { Tab } from "./entities/tab.entity";
import { TabVersion } from "./entities/tab-version.entity";
import { User } from "./entities/user.entity";
import { PracticeModule } from "./practice/practice.module";
import { TabModule } from "./tab/tab.module";
import { TabSvcController } from "./tab-svc.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        url: configService.get<string>("DATABASE_URL"),
        entities: [User, Tab, TabVersion, Follow, PracticeSession],
        synchronize: false,
        ssl:
          configService.get<string>("NODE_ENV") === "production"
            ? { rejectUnauthorized: false }
            : false,
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
    TabModule,
    PracticeModule,
  ],
  controllers: [TabSvcController],
})
export class TabSvcModule {}
