import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";

import { KnobTransaction } from "../entities/knob-transaction.entity";
import { User } from "../entities/user.entity";
import { KnobService } from "./knob.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, KnobTransaction]),
    // Knob 적립/차감을 community-svc에 emit하기 위한 클라이언트.
    ClientsModule.registerAsync([
      {
        name: "COMMUNITY_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("COMMUNITY_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("COMMUNITY_SVC_PORT") ?? "3005", 10),
          },
        }),
      },
    ]),
  ],
  providers: [KnobService],
  exports: [KnobService],
})
export class KnobModule {}
