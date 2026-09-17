import { Inject, Injectable } from '@nestjs/common';
import type { ChartResponse } from '@weekeasy/api-contracts';
import type { Prisma } from '@weekeasy/database';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import type { ChartRepository, SaveChartInput } from '../application/chart.repository.js';

const chartSelection = {
  id: true,
  profileId: true,
  birthRecordId: true,
  engineVersion: true,
  calendarAdapter: true,
  calendarAdapterVersion: true,
  calculationPolicyVersion: true,
  status: true,
  yearPillar: true,
  monthPillar: true,
  dayPillar: true,
  hourPillar: true,
  chartData: true,
  warnings: true,
  calculatedAt: true,
} as const;

interface SelectedChart {
  id: string;
  profileId: string;
  birthRecordId: string;
  engineVersion: string;
  calendarAdapter: string;
  calendarAdapterVersion: string;
  calculationPolicyVersion: string;
  status: ChartResponse['status'];
  yearPillar: string | null;
  monthPillar: string | null;
  dayPillar: string | null;
  hourPillar: string | null;
  chartData: Prisma.JsonValue;
  warnings: Prisma.JsonValue;
  calculatedAt: Date;
}

// chartData 与 warnings 由确定性引擎写入，读取时按其契约结构回投。
function toResponse(chart: SelectedChart): ChartResponse {
  return {
    id: chart.id,
    profileId: chart.profileId,
    birthRecordId: chart.birthRecordId,
    engineVersion: chart.engineVersion,
    calendarAdapter: chart.calendarAdapter,
    calendarAdapterVersion: chart.calendarAdapterVersion,
    calculationPolicyVersion: chart.calculationPolicyVersion,
    status: chart.status,
    yearPillar: chart.yearPillar,
    monthPillar: chart.monthPillar,
    dayPillar: chart.dayPillar,
    hourPillar: chart.hourPillar,
    chartData: chart.chartData as ChartResponse['chartData'],
    warnings: chart.warnings as ChartResponse['warnings'],
    calculatedAt: chart.calculatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaChartRepository implements ChartRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async save(input: SaveChartInput): Promise<ChartResponse> {
    // 相同计算先查已有快照，避免重复写入并保持幂等。
    const existing = await this.database.client.natalChart.findUnique({
      where: { calculationHash: input.calculationHash },
      select: chartSelection,
    });
    if (existing) {
      return toResponse(existing);
    }

    const chart = await this.database.client.natalChart.create({
      data: {
        profileId: input.profileId,
        birthRecordId: input.birthRecordId,
        engineVersion: input.engineVersion,
        calendarAdapter: input.calendarAdapter,
        calendarAdapterVersion: input.calendarAdapterVersion,
        calculationPolicyVersion: input.calculationPolicyVersion,
        yearPillar: input.yearPillar,
        monthPillar: input.monthPillar,
        dayPillar: input.dayPillar,
        hourPillar: input.hourPillar,
        chartData: input.chartData as Prisma.InputJsonValue,
        warnings: [...input.warnings] as Prisma.InputJsonValue,
        calculationHash: input.calculationHash,
      },
      select: chartSelection,
    });
    return toResponse(chart);
  }

  async findLatestOwned(guestSessionId: string, profileId: string): Promise<ChartResponse | null> {
    const chart = await this.database.client.natalChart.findFirst({
      where: {
        profileId,
        profile: { anonymousId: guestSessionId, deletedAt: null },
      },
      orderBy: { calculatedAt: 'desc' },
      select: chartSelection,
    });
    return chart ? toResponse(chart) : null;
  }
}
