import { describe, expect, it } from 'vitest';
import { resolveBirthInstant, type BirthInstantInput } from './birth-instant.js';

const base: BirthInstantInput = {
  calendarType: 'SOLAR',
  isLeapMonth: false,
  localDate: '2000-01-01',
  localTime: '12:30',
  timezoneId: 'Asia/Shanghai',
  latitude: null,
  longitude: null,
  useTrueSolarTime: false,
};

describe('resolveBirthInstant', () => {
  it('公历已知时辰：解析当地日期时间并换算 UTC 时刻', () => {
    const r = resolveBirthInstant(base);
    expect(r.chartLocalDateTime).toEqual({ year: 2000, month: 1, day: 1, hour: 12, minute: 30 });
    // UTC+8：当地时间减 8 小时。
    expect(r.utcInstant).toBe('2000-01-01T04:30:00.000Z');
    expect(r.isTimeKnown).toBe(true);
    expect(r.trueSolarTimeOffsetMinutes).toBe(0);
  });

  it('未知时辰：以正午占位并标记 isTimeKnown=false', () => {
    const r = resolveBirthInstant({ ...base, localTime: null });
    expect(r.isTimeKnown).toBe(false);
    expect(r.chartLocalDateTime.hour).toBe(12);
  });

  it('农历转公历：2000 正月初一 = 2000-02-05', () => {
    const r = resolveBirthInstant({
      ...base,
      calendarType: 'LUNAR',
      localDate: '2000-01-01',
      localTime: '12:00',
    });
    expect(r.chartLocalDateTime).toEqual({ year: 2000, month: 2, day: 5, hour: 12, minute: 0 });
  });

  it('支持农历三十和闰月输入', () => {
    const regular = resolveBirthInstant({ ...base, calendarType: 'LUNAR', localDate: '2023-02-30' });
    const leap = resolveBirthInstant({ ...base, calendarType: 'LUNAR', isLeapMonth: true, localDate: '2023-02-01' });
    expect(regular.chartLocalDateTime).toMatchObject({ year: 2023, month: 3, day: 21 });
    expect(leap.chartLocalDateTime).toMatchObject({ year: 2023, month: 3, day: 22 });
  });

  it('根据 IANA 时区推导历史 UTC 偏移', () => {
    const summer = resolveBirthInstant({ ...base, timezoneId: 'America/New_York', localDate: '2024-07-01' });
    const winter = resolveBirthInstant({ ...base, timezoneId: 'America/New_York', localDate: '2024-01-01' });
    expect(summer.utcOffsetMinutes).toBe(-240);
    expect(winter.utcOffsetMinutes).toBe(-300);
  });

  it('拒绝夏令时跳时区间内不存在的当地时间', () => {
    expect(() => resolveBirthInstant({
      ...base,
      timezoneId: 'America/New_York',
      localDate: '2024-03-10',
      localTime: '02:30',
    })).toThrow(/CHART_INVALID_LOCAL_TIME/);
  });

  it('真太阳时修正改变当地时刻', () => {
    const r = resolveBirthInstant({
      ...base,
      useTrueSolarTime: true,
      latitude: 30.57,
      longitude: 104.07,
      localDate: '2000-06-01',
      localTime: '12:00',
    });
    // 成都约 -61.5 分钟，12:00 -> 10:58。
    expect(r.chartLocalDateTime.hour).toBe(10);
    expect(r.trueSolarTimeOffsetMinutes).toBeLessThan(0);
  });

  it('真太阳时修正跨过午夜会进位到次日', () => {
    const r = resolveBirthInstant({
      ...base,
      useTrueSolarTime: true,
      longitude: 130,
      localDate: '2000-04-15',
      localTime: '23:50',
    });
    expect(r.chartLocalDateTime.day).toBe(16);
    expect(r.chartLocalDateTime.hour).toBe(0);
  });

  it('启用真太阳时但缺少经度：给出警告且不修正', () => {
    const r = resolveBirthInstant({ ...base, useTrueSolarTime: true });
    expect(r.trueSolarTimeOffsetMinutes).toBe(0);
    expect(r.warnings).toContain(
      'TRUE_SOLAR_TIME_WITHOUT_LONGITUDE: 启用真太阳时但缺少经度，已按钟表时间计算',
    );
  });

  it('非法日期抛出稳定错误码', () => {
    expect(() => resolveBirthInstant({ ...base, localDate: '2000-13-01' })).toThrow(
      /CHART_INVALID_DATE/,
    );
  });

  it('非法时区抛出错误', () => {
    expect(() => resolveBirthInstant({ ...base, timezoneId: 'Not/AZone' })).toThrow(
      /Invalid IANA time zone/,
    );
  });
});
