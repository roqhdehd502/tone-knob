import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { MediaSvcModule } from "./media-svc.module";

async function bootstrap() {
  const logger = new Logger("MediaSvc");

  const appContext = await NestFactory.createApplicationContext(MediaSvcModule);
  const configService = appContext.get(ConfigService);
  const port = parseInt(configService.get<string>("MEDIA_SVC_PORT") ?? "3008", 10);
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(MediaSvcModule, {
    transport: Transport.TCP,
    options: { host: "0.0.0.0", port },
  });

  await app.listen();
  logger.log(`Media microservice listening on TCP :${port}`);
}
bootstrap();
