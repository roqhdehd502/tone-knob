import { Module } from "@nestjs/common";

import { PracticeProxyController } from "./practice-proxy.controller";
import { TabProxyController } from "./tab-proxy.controller";

@Module({
  controllers: [TabProxyController, PracticeProxyController],
})
export class TabProxyModule {}
