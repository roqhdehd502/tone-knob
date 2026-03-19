import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KnobTransaction } from '../entities/knob-transaction.entity';
import { User } from '../entities/user.entity';
import { KnobService } from './knob.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, KnobTransaction])],
  providers: [KnobService],
  exports: [KnobService],
})
export class KnobModule {}
