import { describe, expect, it } from 'vitest';
import { calculateNatalChart } from './engine.js';
import { formatPillar, type ChartCalculationInput } from './types.js';

const base: ChartCalculationInput = {
  calendarType: 'SOLAR',
  precision: 'MINUTE',
  localDate: '2000-01-01',
  localTime: '12:00',
  timezoneId: 'Asia/Shanghai',
  utcOffsetMinutes: 480,
  latitude: null,
  longitude: null,
  useTrueSolarTime: false,
  dayBoundaryRule: 'MIDNIGHT',
};

function chart(input: Partial<ChartCalculationInput>) {
  return calculateNatalChart({ ...base, ...input });
}

function pillars(c: ReturnType<typeof chart>): string {
  return [
    formatPillar(c.year),
    formatPillar(c.month),
    formatPillar(c.day),
    c.hour ? formatPillar(c.hour) : '',
  ].join(' ');
}

describe('calculateNatalChart', () => {
  it('公历已知时辰产出四柱', () => {
    expect(pillars(chart({}))).toBe('己卯 丙子 戊午 戊午');
  });

  it('未知时辰缺少时柱并给出警告', () => {
    const c = chart({ localTime: null, precision: 'UNKNOWN_HOUR' });
    expect(c.hour).toBeNull();
    expect(c.warnings).toContain('UNKNOWN_HOUR: 缺少出生时辰，仅计算年、月、日三柱');
  });

  it('晚子时按换日策略给出敏感警告', () => {
    const c = chart({ localDate: '2024-01-01', localTime: '23:30', dayBoundaryRule: 'LATE_ZI_HOUR' });
    expect(c.warnings).toContain(
      'LATE_ZI_HOUR: 出生时间处于晚子时，日柱按「LATE_ZI_HOUR」策略计算',
    );
  });

  it('真太阳时使时辰前移', () => {
    // 成都 104.07E 修正约 -61 分钟，12:00 的午时变为巳时。
    const c = chart({
      localDate: '2000-06-01',
      useTrueSolarTime: true,
      latitude: 30.57,
      longitude: 104.07,
    });
    expect(formatPillar(c.hour!)).toBe('辛巳');
  });

  it('引擎版本与版本信息已注入', () => {
    const c = chart({});
    expect(c.engineVersion).toBe('0.1.0');
    expect(c.warnings).toEqual([]);
  });
});
