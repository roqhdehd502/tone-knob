import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiJob } from '../entities/ai-job.entity';
import { AiGenService } from './ai-gen.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiJob])],
  providers: [AiGenService],
  exports: [AiGenService],
})
export class AiGenModule {}
