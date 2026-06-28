import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { SubscriptionSvcModule } from "./subscription-svc.module";

async function bootstrap() {
  const logger = new Logger("SubscriptionSvc");

  const appContext = await NestFactory.createApplicationContext(SubscriptionSvcModule);
  const configService = appContext.get(ConfigService);
  const port = parseInt(configService.get<string>("SUBSCRIPTION_SVC_PORT") ?? "3007", 10);
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(SubscriptionSvcModule, {
    transport: Transport.TCP,
    options: { host: "0.0.0.0", port },
  });

  await app.listen();
  logger.log(`Subscription microservice listening on TCP :${port}`);
}
bootstrap();
