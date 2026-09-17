import { describe, expect, it } from 'vitest';
import {
  createBirthRecordRequestSchema,
  createProfileRequestSchema,
  updateProfileRequestSchema,
} from '../src/index.js';

describe('profile contracts', () => {
  it('trims profile input and applies safe defaults', () => {
    expect(createProfileRequestSchema.parse({ displayName: '  我  ' })).toEqual({
      displayName: '我',
      relationship: 'SELF',
      gender: 'UNSPECIFIED',
      concernTopics: [],
      consentConfirmed: false,
    });
  });

  it('rejects an empty profile update', () => {
    expect(updateProfileRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('birth record contracts', () => {
  const validInput = {
    calendarType: 'SOLAR',
    precision: 'MINUTE',
    localDate: '1990-06-15',
    localTime: '08:30',
    timezoneId: 'Asia/Shanghai',
    utcOffsetMinutes: 480,
  } as const;

  it('accepts a complete minute-precision input', () => {
    expect(createBirthRecordRequestSchema.safeParse(validInput).success).toBe(true);
  });

  const invalidCases: Array<[Record<string, unknown>, string]> = [
    [{ ...validInput, localDate: '2025-02-30' }, '无效日期'],
    [{ ...validInput, timezoneId: 'Mars/Olympus' }, '无效时区'],
    [
      { ...validInput, precision: 'UNKNOWN_HOUR', localTime: '08:30' },
      '未知时辰仍提交时间',
    ],
    [{ ...validInput, precision: 'HOUR', localTime: '08:30' }, '小时精度带分钟'],
    [{ ...validInput, latitude: 31.2 }, '只提交纬度'],
    [{ ...validInput, useTrueSolarTime: true }, '真太阳时缺少经纬度'],
  ];

  it.each(invalidCases)('rejects %s (%s)', (input) => {
    expect(createBirthRecordRequestSchema.safeParse(input).success).toBe(false);
  });
});
