import { describe, expect, it } from 'vitest';
import { calculateNatalChart } from './engine.js';
import { formatPillar, type ChartCalculationInput } from './types.js';

// 排盘黄金用例：期望四柱已对照万年历/lunar-typescript 手工核验，
// 用于锁定确定性行为、防止回归。所有日期均为虚构/公开数据，不含真实用户资料。
// 规则版本：ENGINE_VERSION=0.1.0；历法适配：lunar-typescript@1.8.6；时区：Asia/Shanghai(UTC+8)。

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

function chart(input: Partial<ChartCalculationInput>): string {
  const c = calculateNatalChart({ ...base, ...input });
  return [c.year, c.month, c.day, c.hour]
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => formatPillar(p))
    .join(' ');
}

describe('排盘黄金用例', () => {
  it('公历已知时辰：2000-01-01 00:30', () => {
    expect(chart({ localDate: '2000-01-01', localTime: '00:30' })).toBe('己卯 丙子 戊午 壬子');
  });

  it('公历已知时辰：2024-02-10 00:30（春节）', () => {
    expect(chart({ localDate: '2024-02-10', localTime: '00:30' })).toBe('甲辰 丙寅 甲辰 甲子');
  });

  it('立春边界之前：2000-02-04 20:00 仍属己卯年、丑月', () => {
    // 立春 2000 约在 20:40，此前年柱仍为己卯、月柱仍为丁丑。
    expect(chart({ localDate: '2000-02-04', localTime: '20:00' })).toBe('己卯 丁丑 壬辰 庚戌');
  });

  it('立春边界之后：2000-02-04 21:00 进入庚辰年、寅月', () => {
    expect(chart({ localDate: '2000-02-04', localTime: '21:00' })).toBe('庚辰 戊寅 壬辰 辛亥');
  });

  it('节气边界：2000-03-05 23:59 已过惊蛰，月柱为卯月', () => {
    // 惊蛰 2000 约在 15:42，此后月柱进入己卯。
    expect(chart({ localDate: '2000-03-05', localTime: '23:59' })).toBe('庚辰 己卯 壬戌 壬子');
  });

  it('晚子时换日：2024-01-01 23:30 按 MIDNIGHT 日柱为甲子', () => {
    expect(chart({ localDate: '2024-01-01', localTime: '23:30' })).toBe('癸卯 甲子 甲子 丙子');
  });

  it('晚子时换日：2024-01-01 23:30 按 LATE_ZI_HOUR 日柱为乙丑', () => {
    expect(
      chart({ localDate: '2024-01-01', localTime: '23:30', dayBoundaryRule: 'LATE_ZI_HOUR' }),
    ).toBe('癸卯 甲子 乙丑 丙子');
  });

  it('农历输入：2000 正月初一 12:00', () => {
    // 农历 2000-01-01 = 公历 2000-02-05。
    expect(chart({ calendarType: 'LUNAR', localDate: '2000-01-01', localTime: '12:00' })).toBe(
      '庚辰 戊寅 癸巳 戊午',
    );
  });

  it('未知时辰：仅年、月、日三柱', () => {
    expect(chart({ localDate: '2000-06-01', localTime: null, precision: 'UNKNOWN_HOUR' })).toBe(
      '庚辰 辛巳 庚寅',
    );
  });

  it('真太阳时：成都 104.07E 使午时前移为巳时', () => {
    expect(
      chart({
        localDate: '2000-06-01',
        localTime: '12:00',
        useTrueSolarTime: true,
        latitude: 30.57,
        longitude: 104.07,
      }),
    ).toBe('庚辰 辛巳 庚寅 辛巳');
  });
});
