import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { JamSvcModule } from "./jam-svc.module";

async function bootstrap() {
  const httpPort = parseInt(process.env.JAM_SVC_HTTP_PORT ?? "3004", 10);
  const tcpPort = parseInt(process.env.JAM_SVC_PORT ?? "3003", 10);

  // Hybrid app: HTTP (WebSocket) + TCP (microservice)
  const app = await NestFactory.create(JamSvcModule);

  app.enableCors({ origin: "*", credentials: true });

  // Attach TCP microservice transport
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: "0.0.0.0",
      port: tcpPort,
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpPort);

  Logger.log(`Jam service HTTP (WebSocket) on :${httpPort}`, "JamSvc");
  Logger.log(`Jam service TCP on :${tcpPort}`, "JamSvc");
}

void bootstrap();
