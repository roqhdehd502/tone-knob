import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { AiSvcModule } from "./ai-svc.module";

async function bootstrap() {
  const logger = new Logger("AiSvc");

  const appContext = await NestFactory.createApplicationContext(AiSvcModule);
  const configService = appContext.get(ConfigService);
  const port = parseInt(configService.get<string>("AI_SVC_PORT") ?? "3009", 10);
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AiSvcModule, {
    transport: Transport.TCP,
    options: { host: "0.0.0.0", port },
  });

  await app.listen();
  logger.log(`AI microservice listening on TCP :${port}`);
}
void bootstrap();
