import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { MarketplaceSvcModule } from "./marketplace-svc.module";

async function bootstrap() {
  const logger = new Logger("MarketplaceSvc");

  const appContext = await NestFactory.createApplicationContext(MarketplaceSvcModule);
  const configService = appContext.get(ConfigService);
  const port = parseInt(configService.get<string>("MARKETPLACE_SVC_PORT") ?? "3006", 10);
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(MarketplaceSvcModule, {
    transport: Transport.TCP,
    options: { host: "0.0.0.0", port },
  });

  await app.listen();
  logger.log(`Marketplace microservice listening on TCP :${port}`);
}
bootstrap();
