import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { AuthSvcModule } from "./auth-svc.module";

async function bootstrap() {
  const port = parseInt(process.env.AUTH_SVC_PORT ?? "3001", 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthSvcModule, {
    transport: Transport.TCP,
    options: {
      host: "0.0.0.0",
      port,
    },
  });

  await app.listen();
  Logger.log(`Auth service listening on TCP :${port}`, "AuthSvc");
}

void bootstrap();
