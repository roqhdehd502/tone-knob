import { Global, Module } from '@nestjs/common';

import { CdnService } from './cdn.service';

@Global()
@Module({
  providers: [CdnService],
  exports: [CdnService],
})
export class CdnModule {}
