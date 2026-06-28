import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { AuthSvcController } from './auth-svc.controller';
import { User } from './entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User],
        synchronize: false,
        ssl: configService.get<string>('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: 'MARKETPLACE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('MARKETPLACE_SVC_HOST') ?? 'localhost',
            port: parseInt(
              configService.get<string>('MARKETPLACE_SVC_PORT') ?? '3006',
              10,
            ),
          },
        }),
      },
    ]),
    AuthModule,
    UserModule,
  ],
  controllers: [AuthSvcController],
})
export class AuthSvcModule {}
