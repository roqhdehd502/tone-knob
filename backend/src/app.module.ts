import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminModule } from './admin/admin.module';
import { AiGenModule } from './ai-gen/ai-gen.module';
import { AuthModule } from './auth/auth.module';
import { CdnModule } from './cdn/cdn.module';
import { CollabModule } from './collab/collab.module';
import { CommunityModule } from './community/community.module';
import { buildTypeOrmConfig } from './database/database.config';
import { AiJob } from './entities/ai-job.entity';
import { CollabOperation } from './entities/collab-operation.entity';
import { CollabSession } from './entities/collab-session.entity';
import { Comment } from './entities/comment.entity';
import { Follow } from './entities/follow.entity';
import { JamParticipant } from './entities/jam-participant.entity';
import { JamRoom } from './entities/jam-room.entity';
import { Like } from './entities/like.entity';
import { Notification } from './entities/notification.entity';
import { Payment } from './entities/payment.entity';
import { PracticeSession } from './entities/practice-session.entity';
import { Recording } from './entities/recording.entity';
import { Review } from './entities/review.entity';
import { Settlement } from './entities/settlement.entity';
import { Subscription } from './entities/subscription.entity';
import { Tab } from './entities/tab.entity';
import { TabPurchase } from './entities/tab-purchase.entity';
import { TabVersion } from './entities/tab-version.entity';
import { User } from './entities/user.entity';
import { HealthModule } from './health/health.module';
import { JamRoomModule } from './jam-room/jam-room.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { RegionModule } from './media/region.module';
import { NotificationModule } from './notification/notification.module';
import { PaymentModule } from './payment/payment.module';
import { PracticeModule } from './practice/practice.module';
import { RecordingModule } from './recording/recording.module';
import { ReviewModule } from './review/review.module';
import { SettlementModule } from './settlement/settlement.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TabModule } from './tab/tab.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 10 },
        { name: 'medium', ttl: 10000, limit: 50 },
        { name: 'long', ttl: 60000, limit: 200 },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...buildTypeOrmConfig(configService),
        entities: [
          User,
          Tab,
          TabVersion,
          JamRoom,
          JamParticipant,
          Like,
          Comment,
          Follow,
          Notification,
          Review,
          TabPurchase,
          Subscription,
          Settlement,
          PracticeSession,
          Recording,
          Payment,
          CollabSession,
          CollabOperation,
          AiJob,
        ],
      }),
    }),
    AuthModule,
    UserModule,
    TabModule,
    JamRoomModule,
    CommunityModule,
    NotificationModule,
    ReviewModule,
    MarketplaceModule,
    SubscriptionModule,
    SettlementModule,
    PracticeModule,
    RecordingModule,
    AdminModule,
    PaymentModule,
    CollabModule,
    AiGenModule,
    CdnModule,
    HealthModule,
    RegionModule,
  ],
})
export class AppModule {}
