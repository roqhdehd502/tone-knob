import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Settlement } from '../entities/settlement.entity';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Settlement, Subscription])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
