import { createHmac } from 'node:crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChartResponse, CreateBirthRecordRequest } from '@weekeasy/api-contracts';
import { CHART_VERSION_INFO, calculateNatalChart, formatPillar } from '@weekeasy/bazi-core';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import { CHART_REPOSITORY, type ChartRepository } from './chart.repository.js';

@Injectable()
export class ChartService {
  private readonly hashSecret: string;

  constructor(
    @Inject(CHART_REPOSITORY)
    private readonly repository: ChartRepository,
    @Inject(ConfigService) config: ConfigService<ServerEnvironment, true>,
  ) {
    this.hashSecret = config.get('DATA_HASH_SECRET', { infer: true });
  }

  // 由出生输入确定性计算命盘并保存快照；相同输入与版本会命中同一 calculationHash。
  async generateAndSave(
    profileId: string,
    birthRecordId: string,
    birthRecord: CreateBirthRecordRequest,
  ): Promise<ChartResponse> {
    const chart = calculateNatalChart(birthRecord);

    return this.repository.save({
      profileId,
      birthRecordId,
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
      calculationHash: this.hashCalculation(birthRecord),
    });
  }

  async latest(guestSessionId: string, profileId: string): Promise<ChartResponse> {
    const chart = await this.repository.findLatestOwned(guestSessionId, profileId);
    if (!chart) {
      throw new NotFoundException({ code: 'CHART_NOT_FOUND', message: '命盘不存在' });
    }
    return chart;
  }

  private hashCalculation(input: CreateBirthRecordRequest): string {
    // 计算指纹仅用于判重，输入与版本组合不可反推原始出生资料。
    return createHmac('sha256', this.hashSecret)
      .update(
        JSON.stringify({
          input,
          engineVersion: CHART_VERSION_INFO.engineVersion,
          calendarAdapterVersion: CHART_VERSION_INFO.calendarAdapterVersion,
          calculationPolicyVersion: CHART_VERSION_INFO.calculationPolicyVersion,
        }),
      )
      .digest('hex');
  }
}
