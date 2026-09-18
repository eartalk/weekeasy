import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { BirthRecordResponse, CreateBirthRecordRequest } from '@weekeasy/api-contracts';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import type { ChartService } from '../src/modules/charts/application/chart.service.js';
import type { CalculatedChartSnapshot } from '../src/modules/charts/application/chart.repository.js';
import type { BirthRecordRepository } from '../src/modules/profiles/application/birth-record.repository.js';
import { BirthRecordService } from '../src/modules/profiles/application/birth-record.service.js';

const input: CreateBirthRecordRequest = {
  calendarType: 'SOLAR',
  isLeapMonth: false,
  precision: 'MINUTE',
  localDate: '2000-01-01',
  localTime: '12:00',
  timezoneId: 'Asia/Shanghai',
  countryCode: null,
  regionName: null,
  cityName: null,
  latitude: null,
  longitude: null,
  useTrueSolarTime: false,
  dayBoundaryRule: 'MIDNIGHT',
};

const snapshot = {
  engineVersion: '0.3.0',
  calendarAdapter: 'lunar-typescript',
  calendarAdapterVersion: '1.8.6',
  calculationPolicyVersion: '0.2.0',
  yearPillar: '己卯', monthPillar: '丙子', dayPillar: '戊午', hourPillar: '戊午',
  chartData: {}, warnings: [], utcOffsetMinutes: 480, adjustedLocalDatetime: null,
} satisfies CalculatedChartSnapshot;

function config(): ConfigService<ServerEnvironment, true> {
  return { get: () => 'a'.repeat(64) } as unknown as ConfigService<ServerEnvironment, true>;
}

describe('BirthRecordService', () => {
  it('先完成确定性排盘，再把出生版本和命盘交给同一仓储事务', async () => {
    const response = { id: '01993f2e-8100-7000-8000-000000000010' } as BirthRecordResponse;
    const repository = {
      createVersion: vi.fn(async () => response),
      findLatestOwned: vi.fn(async () => null),
    } satisfies BirthRecordRepository;
    const charts = { prepare: vi.fn(() => snapshot) } as unknown as ChartService;
    const service = new BirthRecordService(repository, charts, config());

    await expect(service.create('guest', 'profile', input)).resolves.toBe(response);
    expect(repository.createVersion).toHaveBeenCalledWith(expect.objectContaining({ chart: snapshot }));
  });

  it('排盘输入非法时不写出生版本', async () => {
    const repository = {
      createVersion: vi.fn(),
      findLatestOwned: vi.fn(async () => null),
    } satisfies BirthRecordRepository;
    const charts = { prepare: vi.fn(() => { throw new Error('invalid'); }) } as unknown as ChartService;
    const service = new BirthRecordService(repository, charts, config());

    await expect(service.create('guest', 'profile', input)).rejects.toThrow('invalid');
    expect(repository.createVersion).not.toHaveBeenCalled();
  });
});
