import { describe, expect, it } from 'vitest';
import { equationOfTimeMinutes, trueSolarTimeOffsetMinutes } from './true-solar-time.js';

describe('equationOfTimeMinutes', () => {
  it('2 月中旬约为 -14.6 分钟（真太阳时落后钟表）', () => {
    expect(equationOfTimeMinutes(2000, 2, 11)).toBeCloseTo(-14.58, 0);
  });

  it('11 月上旬约为 +16.3 分钟（真太阳时领先钟表）', () => {
    expect(equationOfTimeMinutes(2000, 11, 3)).toBeCloseTo(16.33, 0);
  });

  it('4 月中旬与 6 月中旬接近 0', () => {
    expect(equationOfTimeMinutes(2000, 4, 15)).toBeCloseTo(0, 0);
    expect(equationOfTimeMinutes(2000, 6, 13)).toBeCloseTo(0, 0);
  });
});

describe('trueSolarTimeOffsetMinutes', () => {
  it('北京（116.4E）比东八区中央经线晚约 14.4 分钟', () => {
    const offset = trueSolarTimeOffsetMinutes({
      longitude: 116.4,
      utcOffsetMinutes: 480,
      year: 2000,
      month: 4,
      day: 15,
    });
    expect(offset).toBeCloseTo(-14.4, 0);
  });

  it('中央经线以东为正向修正', () => {
    const offset = trueSolarTimeOffsetMinutes({
      longitude: 130,
      utcOffsetMinutes: 480,
      year: 2000,
      month: 4,
      day: 15,
    });
    expect(offset).toBeCloseTo(40, 0);
  });
});
