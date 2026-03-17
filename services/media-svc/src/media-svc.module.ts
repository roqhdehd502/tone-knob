import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CdnModule } from './cdn/cdn.module';
import { RegionModule } from './region/region.module';
import { MediaSvcController } from './media-svc.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CdnModule,
    RegionModule,
  ],
  controllers: [MediaSvcController],
})
export class MediaSvcModule {}
