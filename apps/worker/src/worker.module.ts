import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { validateServerEnvironment } from '@weekeasy/config/environment';
import { CacheModule } from './infrastructure/cache/cache.module.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { WorkerStatusService } from './services/worker-status.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: [resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '.env')],
      isGlobal: true,
      validate: validateServerEnvironment,
    }),
    DatabaseModule,
    CacheModule,
  ],
  providers: [WorkerStatusService],
})
export class WorkerModule {}
