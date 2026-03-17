import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Follow } from '../entities/follow.entity';
import { Tab } from '../entities/tab.entity';
import { TabVersion } from '../entities/tab-version.entity';
import { TabService } from './tab.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tab, TabVersion, Follow])],
  providers: [TabService],
  exports: [TabService],
})
export class TabModule {}
