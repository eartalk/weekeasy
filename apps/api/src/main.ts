import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.API_PORT ?? 3001);

  app.setGlobalPrefix('api');
  app.enableVersioning({ defaultVersion: '1', type: VersioningType.URI });
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: true, transform: true }));

  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
