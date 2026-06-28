import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Badge } from "./entities/badge.entity";
import { Comment } from "./entities/comment.entity";
import { Follow } from "./entities/follow.entity";
import { Like } from "./entities/like.entity";
import { Notification } from "./entities/notification.entity";
import { Review } from "./entities/review.entity";
import { Tab } from "./entities/tab.entity";
import { User } from "./entities/user.entity";
import { UserBadge } from "./entities/user-badge.entity";

import { BadgeModule } from "./badge/badge.module";
import { CommunityModule } from "./community/community.module";
import { NotificationModule } from "./notification/notification.module";
import { ReviewModule } from "./review/review.module";
import { CommunitySvcController } from "./community-svc.controller";
import { EventHandlerController } from "./events/event-handler.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres" as const,
        url: configService.get<string>("DATABASE_URL"),
        entities: [
          User,
          Tab,
          Like,
          Comment,
          Follow,
          Notification,
          Review,
          Badge,
          UserBadge,
        ],
        synchronize: false,
        logging: configService.get("NODE_ENV") === "development",
      }),
    }),
    TypeOrmModule.forFeature([Follow, Tab, Like, Review]),
    // 자기 자신(community-svc)에게 내부 이벤트를 emit하기 위한 self-loop 클라이언트.
    // EventHandlerController가 동일 TCP 포트에서 @EventPattern으로 수신한다.
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
    BadgeModule,
    CommunityModule,
    NotificationModule,
    ReviewModule,
  ],
  controllers: [CommunitySvcController, EventHandlerController],
})
export class CommunitySvcModule {}
