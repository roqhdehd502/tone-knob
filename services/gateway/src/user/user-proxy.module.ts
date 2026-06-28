import { Module } from "@nestjs/common";

import { UserProxyController } from "./user-proxy.controller";

@Module({
  controllers: [UserProxyController],
})
export class UserProxyModule {}
