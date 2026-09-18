import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ChartResponse, CreateBirthRecordRequest } from '@weekeasy/api-contracts';
import { CHART_VERSION_INFO, calculateNatalChart, formatPillar } from '@weekeasy/bazi-core';
import {
  CHART_REPOSITORY,
  type CalculatedChartSnapshot,
  type ChartRepository,
} from './chart.repository.js';

@Injectable()
export class ChartService {
  constructor(
    @Inject(CHART_REPOSITORY)
    private readonly repository: ChartRepository,
  ) {}

  // 数据库写入前完成纯计算，非法历法输入不会留下残缺出生版本。
  prepare(birthRecord: CreateBirthRecordRequest): CalculatedChartSnapshot {
    try {
      const chart = calculateNatalChart(birthRecord);
      return {
      engineVersion: chart.engineVersion,
      calendarAdapter: CHART_VERSION_INFO.calendarAdapter,
      calendarAdapterVersion: CHART_VERSION_INFO.calendarAdapterVersion,
      calculationPolicyVersion: CHART_VERSION_INFO.calculationPolicyVersion,
      yearPillar: formatPillar(chart.year),
      monthPillar: formatPillar(chart.month),
      dayPillar: formatPillar(chart.day),
      hourPillar: chart.hour ? formatPillar(chart.hour) : null,
      chartData: {
        year: chart.year,
        month: chart.month,
        day: chart.day,
        hour: chart.hour,
        relations: chart.relations,
      },
      warnings: chart.warnings,
        utcOffsetMinutes: chart.utcOffsetMinutes,
        adjustedLocalDatetime: chart.adjustedLocalDatetime,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('CHART_')) {
        throw new BadRequestException({ code: 'CHART_INPUT_INVALID', message: error.message });
      }
      throw error;
    }
  }

  async latest(guestSessionId: string, profileId: string): Promise<ChartResponse> {
    const chart = await this.repository.findLatestOwned(guestSessionId, profileId);
    if (!chart) {
      throw new NotFoundException({ code: 'CHART_NOT_FOUND', message: '命盘不存在' });
    }
    return chart;
  }
}
