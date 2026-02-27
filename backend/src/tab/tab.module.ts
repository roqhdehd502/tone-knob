import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tab } from '../entities/tab.entity';
import { TabVersion } from '../entities/tab-version.entity';
import { TabController } from './tab.controller';
import { TabService } from './tab.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tab, TabVersion])],
  controllers: [TabController],
  providers: [TabService],
  exports: [TabService],
})
export class TabModule {}
