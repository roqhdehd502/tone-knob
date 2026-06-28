import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CollabModule } from "./collab/collab.module";
import { CollabOperation } from "./entities/collab-operation.entity";
import { CollabSession } from "./entities/collab-session.entity";
import { JamParticipant } from "./entities/jam-participant.entity";
import { JamRoom } from "./entities/jam-room.entity";
import { Tab } from "./entities/tab.entity";
import { User } from "./entities/user.entity";
import { JamRoomModule } from "./jam-room/jam-room.module";
import { JamSvcController } from "./jam-svc.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        url: configService.get<string>("DATABASE_URL"),
        entities: [User, Tab, JamRoom, JamParticipant, CollabSession, CollabOperation],
        synchronize: false,
        ssl:
          configService.get<string>("NODE_ENV") === "production"
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: "MARKETPLACE_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("MARKETPLACE_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("MARKETPLACE_SVC_PORT") ?? "3006", 10),
          },
        }),
      },
    ]),
    JamRoomModule,
    CollabModule,
  ],
  controllers: [JamSvcController],
})
export class JamSvcModule {}
