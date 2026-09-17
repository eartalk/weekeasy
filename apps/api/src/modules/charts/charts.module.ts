import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module.js';
import { CHART_REPOSITORY } from './application/chart.repository.js';
import { ChartService } from './application/chart.service.js';
import { PrismaChartRepository } from './infrastructure/prisma-chart.repository.js';
import { ChartController } from './presentation/chart.controller.js';

@Module({
  imports: [IdentityModule],
  controllers: [ChartController],
  providers: [
    ChartService,
    { provide: CHART_REPOSITORY, useClass: PrismaChartRepository },
  ],
  exports: [ChartService],
})
export class ChartsModule {}
