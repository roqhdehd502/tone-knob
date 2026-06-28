import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { CommunitySvcModule } from "./community-svc.module";

async function bootstrap() {
  const logger = new Logger("CommunitySvc");

  const appContext = await NestFactory.createApplicationContext(CommunitySvcModule);
  const configService = appContext.get(ConfigService);
  const port = parseInt(configService.get<string>("COMMUNITY_SVC_PORT") ?? "3005", 10);
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(CommunitySvcModule, {
    transport: Transport.TCP,
    options: {
      host: "0.0.0.0",
      port,
    },
  });

  await app.listen();
  logger.log(`Community microservice listening on TCP :${port}`);
}
bootstrap();
