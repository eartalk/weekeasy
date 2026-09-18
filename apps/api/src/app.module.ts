import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { validateServerEnvironment } from '@weekeasy/config/environment';
import { CacheModule } from './infrastructure/cache/cache.module.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { ChartsModule } from './modules/charts/charts.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { AssessmentsModule } from './modules/assessments/assessments.module.js';

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
    HealthModule,
    IdentityModule,
    ProfilesModule,
    ChartsModule,
    AssessmentsModule,
  ],
})
export class AppModule {}
