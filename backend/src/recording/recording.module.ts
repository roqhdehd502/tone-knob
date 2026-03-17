import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Recording } from '../entities/recording.entity';
import { RecordingController } from './recording.controller';
import { RecordingService } from './recording.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recording])],
  controllers: [RecordingController],
  providers: [RecordingService],
  exports: [RecordingService],
})
export class RecordingModule {}
