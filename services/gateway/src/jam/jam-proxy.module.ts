import { Module } from '@nestjs/common';

import { JamProxyController } from './jam-proxy.controller';

@Module({
  controllers: [JamProxyController],
})
export class JamProxyModule {}
