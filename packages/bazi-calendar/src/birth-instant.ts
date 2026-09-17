import { Lunar } from 'lunar-typescript';
import { assertIanaTimeZone, toUtcInstant, type LocalDateTime } from './time-zone.js';
import { trueSolarTimeOffsetMinutes } from './true-solar-time.js';

export type CalendarType = 'SOLAR' | 'LUNAR';

export interface BirthInstantInput {
  readonly calendarType: CalendarType;
  readonly localDate: string; // YYYY-MM-DD
  readonly localTime: string | null; // HH:mm，未知时辰为 null
  readonly timezoneId: string;
  readonly utcOffsetMinutes: number;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly useTrueSolarTime: boolean;
}

export interface ResolvedBirthInstant {
  // 排盘采用的当地公历日期时间（农历已转公历，已应用真太阳时修正）。
  readonly chartLocalDateTime: LocalDateTime;
  // 出生 UTC 时刻（ISO 8601），基于物理当地时刻与偏移快照。
  readonly utcInstant: string;
  // 真太阳时修正分钟（未启用或缺少经度时为 0）。
  readonly trueSolarTimeOffsetMinutes: number;
  readonly isTimeKnown: boolean;
  readonly warnings: readonly string[];
}

interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

interface ParsedTime {
  hour: number;
  minute: number;
}

function parseDate(value: string): ParsedDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`CHART_INVALID_DATE: 日期格式必须为 YYYY-MM-DD，收到「${value}」`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`CHART_INVALID_DATE: 日期不合法「${value}」`);
  }
  return { year, month, day };
}

function parseTime(value: string | null): ParsedTime | null {
  if (value === null) {
    return null;
  }
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new Error(`CHART_INVALID_TIME: 时间格式必须为 HH:mm，收到「${value}」`);
  }
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

// 公历/农历统一转为公历当地日期，保留用户输入的当地时刻。
function toSolarLocalDate(calendarType: CalendarType, date: ParsedDate): ParsedDate {
  if (calendarType === 'SOLAR') {
    return date;
  }
  // 农历转公历；闰月无法用 YYYY-MM-DD 表达，属于已知输入限制。
  const lunar = Lunar.fromYmdHms(date.year, date.month, date.day, 12, 0, 0);
  const solar = lunar.getSolar();
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
}

function shiftMinutes(local: LocalDateTime, offsetMinutes: number): LocalDateTime {
  if (offsetMinutes === 0) {
    return local;
  }
  const base = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const shifted = new Date(base + offsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

export function resolveBirthInstant(input: BirthInstantInput): ResolvedBirthInstant {
  assertIanaTimeZone(input.timezoneId);

  const warnings: string[] = [];
  const date = parseDate(input.localDate);
  const time = parseTime(input.localTime);
  const isTimeKnown = time !== null;

  // 未知时辰以正午作为日柱计算的占位时刻，避免子时换日歧义。
  const hour = time?.hour ?? 12;
  const minute = time?.minute ?? 0;

  const solarDate = toSolarLocalDate(input.calendarType, date);
  const physical: LocalDateTime = { ...solarDate, hour, minute };
  const utcInstant = toUtcInstant(physical, input.utcOffsetMinutes);

  let offset = 0;
  if (input.useTrueSolarTime) {
    if (input.longitude === null) {
      warnings.push('TRUE_SOLAR_TIME_WITHOUT_LONGITUDE: 启用真太阳时但缺少经度，已按钟表时间计算');
    } else {
      offset = trueSolarTimeOffsetMinutes({
        longitude: input.longitude,
        utcOffsetMinutes: input.utcOffsetMinutes,
        year: solarDate.year,
        month: solarDate.month,
        day: solarDate.day,
      });
    }
  }

  return {
    chartLocalDateTime: shiftMinutes(physical, offset),
    utcInstant,
    trueSolarTimeOffsetMinutes: offset,
    isTimeKnown,
    warnings,
  };
}
