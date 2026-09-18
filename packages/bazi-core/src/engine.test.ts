import { describe, expect, it } from 'vitest';
import { calculateNatalChart } from './engine.js';
import { formatPillar, type ChartCalculationInput } from './types.js';

const base: ChartCalculationInput = {
  calendarType: 'SOLAR',
  isLeapMonth: false,
  precision: 'MINUTE',
  localDate: '2000-01-01',
  localTime: '12:00',
  timezoneId: 'Asia/Shanghai',
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
    expect(c.adjustedLocalDatetime).not.toBeNull();
  });

  it('引擎版本与版本信息已注入', () => {
    const c = chart({});
    expect(c.engineVersion).toBe('0.3.0');
    expect(c.warnings).toEqual([]);
  });

  it('跨时区节气边界按同一绝对时刻判定年柱和月柱', () => {
    const shanghai = chart({ localDate: '2000-02-04', localTime: '20:00', timezoneId: 'Asia/Shanghai' });
    const newYork = chart({ localDate: '2000-02-04', localTime: '20:00', timezoneId: 'America/New_York' });
    expect([shanghai.year.stem, shanghai.year.branch, shanghai.month.branch]).not.toEqual([
      newYork.year.stem,
      newYork.year.branch,
      newYork.month.branch,
    ]);
  });

  it('产出藏干、五行与十神（2000-01-01 00:30，日主戊）', () => {
    const c = chart({ localTime: '00:30' });
    // 日主为日柱天干，十神为 null。
    expect(c.day.stemTenGod).toBeNull();
    expect(c.year.stemTenGod).toBe('劫财');
    expect(c.month.stemTenGod).toBe('偏印');
    expect(c.hour!.stemTenGod).toBe('偏财');

    // 年支卯藏乙，乙克戊（克我、异阴阳）→ 正官。
    expect(c.year.hiddenStems).toEqual([
      { stem: '乙', element: '木', tenGod: '正官' },
    ]);
    // 月支子藏癸，戊克癸（我克、异阴阳）→ 正财。
    expect(c.month.hiddenStems).toEqual([
      { stem: '癸', element: '水', tenGod: '正财' },
    ]);
    // 日支午藏丁、己。
    expect(c.day.hiddenStems).toEqual([
      { stem: '丁', element: '火', tenGod: '正印' },
      { stem: '己', element: '土', tenGod: '劫财' },
    ]);

    // 卯-子-午-子：子午相冲、子卯相刑。
    expect(c.relations).toContainEqual({ kind: 'clash', positions: ['month', 'day'] });
    expect(c.relations).toContainEqual({ kind: 'clash', positions: ['day', 'hour'] });
    expect(c.relations).toContainEqual({ kind: 'punishment', positions: ['year', 'month'] });
  });
});
