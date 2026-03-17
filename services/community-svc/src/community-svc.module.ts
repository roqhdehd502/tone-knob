import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Comment } from "./entities/comment.entity";
import { Follow } from "./entities/follow.entity";
import { Like } from "./entities/like.entity";
import { Notification } from "./entities/notification.entity";
import { Review } from "./entities/review.entity";
import { Tab } from "./entities/tab.entity";
import { User } from "./entities/user.entity";

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
        entities: [User, Tab, Like, Comment, Follow, Notification, Review],
        synchronize: false,
        logging: configService.get("NODE_ENV") === "development",
      }),
    }),
    CommunityModule,
    NotificationModule,
    ReviewModule,
  ],
  controllers: [CommunitySvcController, EventHandlerController],
})
export class CommunitySvcModule {}
