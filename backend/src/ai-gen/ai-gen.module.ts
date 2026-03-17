import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiJob } from '../entities/ai-job.entity';
import { AiGenController } from './ai-gen.controller';
import { AiGenService } from './ai-gen.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiJob])],
  controllers: [AiGenController],
  providers: [AiGenService],
  exports: [AiGenService],
})
export class AiGenModule {}
