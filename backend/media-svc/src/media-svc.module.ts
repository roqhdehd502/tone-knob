import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { CdnModule } from "./cdn/cdn.module";
import { MediaSvcController } from "./media-svc.controller";
import { RegionModule } from "./region/region.module";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CdnModule, RegionModule, StorageModule],
  controllers: [MediaSvcController],
})
export class MediaSvcModule {}
