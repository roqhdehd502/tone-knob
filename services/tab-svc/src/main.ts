import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { TabSvcModule } from './tab-svc.module';

async function bootstrap() {
  const port = parseInt(process.env.TAB_SVC_PORT ?? '3002', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TabSvcModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );

  await app.listen();
  Logger.log(`Tab service listening on TCP :${port}`, 'TabSvc');
}

void bootstrap();
