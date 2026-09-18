import { describe, expect, it } from 'vitest';
import { resolveBirthInstant } from './birth-instant.js';
import { computeFourPillarIndices } from './four-pillars.js';

function resolve(localDate: string, localTime: string | null, dayBoundaryRule: 'MIDNIGHT' | 'LATE_ZI_HOUR' = 'MIDNIGHT') {
  return computeFourPillarIndices(
    resolveBirthInstant({
      calendarType: 'SOLAR',
      isLeapMonth: false,
      localDate,
      localTime,
      timezoneId: 'Asia/Shanghai',
      latitude: null,
      longitude: null,
      useTrueSolarTime: false,
    }),
    dayBoundaryRule,
  );
}

describe('computeFourPillarIndices', () => {
  it('普通公历日期产出正确的干支索引', () => {
    // 2000-01-01 12:00 -> 己卯 丙子 戊午 戊午（己=5, 卯=3, 丙=2, 子=0, 戊=4, 午=6）。
    const pillars = resolve('2000-01-01', '12:00');
    expect(pillars.year).toEqual({ stem: 5, branch: 3 });
    expect(pillars.month).toEqual({ stem: 2, branch: 0 });
    expect(pillars.day).toEqual({ stem: 4, branch: 6 });
    expect(pillars.hour).toEqual({ stem: 4, branch: 6 });
  });

  it('未知时辰不产时柱', () => {
    const pillars = resolve('2000-01-01', null);
    expect(pillars.hour).toBeNull();
    expect(pillars.day).toEqual({ stem: 4, branch: 6 });
  });

  it('晚子时换日策略改变日柱', () => {
    // 2024-01-01 23:30，MIDNIGHT 日柱为甲子，LATE_ZI_HOUR 日柱为乙丑。
    const midnight = resolve('2024-01-01', '23:30', 'MIDNIGHT');
    const lateZi = resolve('2024-01-01', '23:30', 'LATE_ZI_HOUR');
    expect(midnight.day).toEqual({ stem: 0, branch: 0 }); // 甲子
    expect(lateZi.day).toEqual({ stem: 1, branch: 1 }); // 乙丑
    // 时柱均为丙子（晚子时用次日干起五鼠遁）。
    expect(midnight.hour).toEqual({ stem: 2, branch: 0 });
    expect(lateZi.hour).toEqual({ stem: 2, branch: 0 });
  });
});
