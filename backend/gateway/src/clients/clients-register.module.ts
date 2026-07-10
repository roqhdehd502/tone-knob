import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "AUTH_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("AUTH_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("AUTH_SVC_PORT") ?? "3001", 10),
          },
        }),
      },
      {
        name: "TAB_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("TAB_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("TAB_SVC_PORT") ?? "3002", 10),
          },
        }),
      },
      {
        name: "JAM_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("JAM_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("JAM_SVC_PORT") ?? "3003", 10),
          },
        }),
      },
      {
        name: "COMMUNITY_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("COMMUNITY_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("COMMUNITY_SVC_PORT") ?? "3005", 10),
          },
        }),
      },
      {
        name: "MARKETPLACE_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("MARKETPLACE_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("MARKETPLACE_SVC_PORT") ?? "3006", 10),
          },
        }),
      },
      {
        name: "SUBSCRIPTION_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("SUBSCRIPTION_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("SUBSCRIPTION_SVC_PORT") ?? "3007", 10),
          },
        }),
      },
      {
        name: "MEDIA_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("MEDIA_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("MEDIA_SVC_PORT") ?? "3008", 10),
          },
        }),
      },
      {
        name: "AI_SERVICE",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>("AI_SVC_HOST") ?? "localhost",
            port: parseInt(configService.get<string>("AI_SVC_PORT") ?? "3009", 10),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class ClientsRegisterModule {}
