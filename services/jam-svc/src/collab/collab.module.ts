import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CollabOperation } from '../entities/collab-operation.entity';
import { CollabSession } from '../entities/collab-session.entity';
import { CollabGateway } from './collab.gateway';
import { CollabService } from './collab.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollabSession, CollabOperation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'secret'),
      }),
    }),
  ],
  providers: [CollabService, CollabGateway],
  exports: [CollabService],
})
export class CollabModule {}
