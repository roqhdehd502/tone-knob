import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AiGenModule } from "./ai-gen/ai-gen.module";
import { AiSvcController } from "./ai-svc.controller";
import { AiJob } from "./entities/ai-job.entity";
import { User } from "./entities/user.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres" as const,
        url: configService.get<string>("DATABASE_URL"),
        entities: [User, AiJob],
        synchronize: false,
        logging: configService.get("NODE_ENV") === "development",
      }),
    }),
    ClientsModule.registerAsync([
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
    ]),
    AiGenModule,
  ],
  controllers: [AiSvcController],
})
export class AiSvcModule {}
