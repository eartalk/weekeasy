import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { ChartResponse, CreateBirthRecordRequest } from '@weekeasy/api-contracts';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import type { ChartRepository } from '../src/modules/charts/application/chart.repository.js';
import { ChartService } from '../src/modules/charts/application/chart.service.js';

const birthRecord: CreateBirthRecordRequest = {
  calendarType: 'SOLAR',
  precision: 'MINUTE',
  localDate: '2000-01-01',
  localTime: '00:30',
  timezoneId: 'Asia/Shanghai',
  utcOffsetMinutes: 480,
  countryCode: null,
  regionName: null,
  cityName: null,
  latitude: null,
  longitude: null,
  useTrueSolarTime: false,
  dayBoundaryRule: 'MIDNIGHT',
};

function createRepository(): ChartRepository {
  return {
    save: vi.fn(async (input): Promise<ChartResponse> => {
      return {
        id: '01993f2e-8100-7000-8000-000000000099',
        profileId: input.profileId,
        birthRecordId: input.birthRecordId,
        engineVersion: input.engineVersion,
        calendarAdapter: input.calendarAdapter,
        calendarAdapterVersion: input.calendarAdapterVersion,
        calculationPolicyVersion: input.calculationPolicyVersion,
        status: 'CALCULATED',
        yearPillar: input.yearPillar,
        monthPillar: input.monthPillar,
        dayPillar: input.dayPillar,
        hourPillar: input.hourPillar,
        chartData: input.chartData as ChartResponse['chartData'],
        warnings: [...input.warnings],
        calculatedAt: '2026-09-17T00:00:00.000Z',
      };
    }),
    findLatestOwned: vi.fn(async () => null),
  };
}

function createConfig(): ConfigService<ServerEnvironment, true> {
  return { get: () => 'a'.repeat(64) } as unknown as ConfigService<ServerEnvironment, true>;
}

describe('ChartService', () => {
  it('确定性生成命盘并保存四柱快照', async () => {
    const repository = createRepository();
    const service = new ChartService(repository, createConfig());

    await service.generateAndSave('profile-1', 'birth-record-1', birthRecord);

    expect(repository.save).toHaveBeenCalledTimes(1);
    const input = vi.mocked(repository.save).mock.calls[0]?.[0];
    expect(input).toMatchObject({
      profileId: 'profile-1',
      birthRecordId: 'birth-record-1',
      engineVersion: '0.2.0',
      yearPillar: '己卯',
      monthPillar: '丙子',
      dayPillar: '戊午',
      hourPillar: '壬子',
      calculationHash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(input?.chartData).toHaveProperty('relations');
    expect(input?.warnings).toEqual([]);
  });

  it('latest 不存在时抛出稳定错误码', async () => {
    const repository = createRepository();
    const service = new ChartService(repository, createConfig());

    await expect(service.latest('guest', 'profile-1')).rejects.toMatchObject({
      response: { code: 'CHART_NOT_FOUND', message: '命盘不存在' },
    });
  });
});
