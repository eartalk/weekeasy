import { describe, expect, it, vi } from 'vitest';
import type { CreateBirthRecordRequest } from '@weekeasy/api-contracts';
import type { ChartRepository } from '../src/modules/charts/application/chart.repository.js';
import { ChartService } from '../src/modules/charts/application/chart.service.js';

const birthRecord: CreateBirthRecordRequest = {
  calendarType: 'SOLAR',
  isLeapMonth: false,
  precision: 'MINUTE',
  localDate: '2000-01-01',
  localTime: '00:30',
  timezoneId: 'Asia/Shanghai',
  countryCode: null,
  regionName: null,
  cityName: null,
  latitude: null,
  longitude: null,
  useTrueSolarTime: false,
  dayBoundaryRule: 'MIDNIGHT',
};

function createRepository(): ChartRepository {
  return { findLatestOwned: vi.fn(async () => null) };
}

describe('ChartService', () => {
  it('在数据库写入前确定性生成命盘快照', () => {
    const service = new ChartService(createRepository());
    const snapshot = service.prepare(birthRecord);

    expect(snapshot).toMatchObject({
      engineVersion: '0.3.0',
      yearPillar: '己卯',
      monthPillar: '丙子',
      dayPillar: '戊午',
      hourPillar: '壬子',
      utcOffsetMinutes: 480,
      adjustedLocalDatetime: null,
    });
    expect(snapshot.chartData).toHaveProperty('relations');
    expect(snapshot.warnings).toEqual([]);
  });

  it('非法农历日期返回稳定的 400 业务错误', () => {
    const service = new ChartService(createRepository());
    expect(() => service.prepare({
      ...birthRecord,
      calendarType: 'LUNAR',
      localDate: '2023-01-30',
    })).toThrow(/CHART_INVALID_LUNAR_DATE/);
  });

  it('latest 不存在时抛出稳定错误码', async () => {
    const service = new ChartService(createRepository());
    await expect(service.latest('guest', 'profile-1')).rejects.toMatchObject({
      response: { code: 'CHART_NOT_FOUND', message: '命盘不存在' },
    });
  });
});
