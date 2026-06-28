import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Comment } from "../entities/comment.entity";
import { Follow } from "../entities/follow.entity";
import { Like } from "../entities/like.entity";
import { Tab } from "../entities/tab.entity";
import { CommunityService } from "./community.service";

@Module({
  imports: [TypeOrmModule.forFeature([Like, Comment, Follow, Tab])],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
