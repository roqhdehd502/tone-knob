import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Badge } from "../entities/badge.entity";
import { UserBadge } from "../entities/user-badge.entity";
import { BadgeService } from "./badge.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Badge, UserBadge]),
    // 뱃지 수여/대표뱃지 변경을 community-svc 자신에게 emit하기 위한 self-loop 클라이언트.
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
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {}
