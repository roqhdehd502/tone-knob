import './instrument';

import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tone Knob API Gateway')
    .setDescription('타브 제작 + 실시간 합주 플랫폼 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(configService.get<string>('PORT') ?? '3000', 10);
  await app.listen(port);
  Logger.log(`Gateway listening on http://localhost:${port}`, 'Gateway');
  Logger.log(`Swagger: http://localhost:${port}/api/docs`, 'Gateway');
}

void bootstrap();
