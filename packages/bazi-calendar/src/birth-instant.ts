import { Lunar } from 'lunar-typescript';
import { resolveZonedDateTime, toZonedLocalDateTime, type LocalDateTime } from './time-zone.js';
import { trueSolarTimeOffsetMinutes } from './true-solar-time.js';

export type CalendarType = 'SOLAR' | 'LUNAR';

export interface BirthInstantInput {
  readonly calendarType: CalendarType;
  readonly isLeapMonth: boolean;
  readonly localDate: string; // YYYY-MM-DD
  readonly localTime: string | null; // HH:mm，未知时辰为 null
  readonly timezoneId: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly useTrueSolarTime: boolean;
}

export interface ResolvedBirthInstant {
  // 排盘采用的当地公历日期时间（农历已转公历，已应用真太阳时修正）。
  readonly chartLocalDateTime: LocalDateTime;
  // 出生 UTC 时刻（ISO 8601），基于物理当地时刻与偏移快照。
  readonly utcInstant: string;
  readonly utcOffsetMinutes: number;
  // lunar-typescript 的节气时刻以东八区墙上时间表达，年柱和月柱据此判界。
  readonly solarTermDateTime: LocalDateTime;
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

function parseDate(value: string, calendarType: CalendarType): ParsedDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`CHART_INVALID_DATE: 日期格式必须为 YYYY-MM-DD，收到「${value}」`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (calendarType === 'SOLAR') {
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) {
      throw new Error(`CHART_INVALID_DATE: 公历日期不合法「${value}」`);
    }
  } else if (month < 1 || month > 12 || day < 1 || day > 30) {
    throw new Error(`CHART_INVALID_LUNAR_DATE: 农历日期不合法「${value}」`);
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
function toSolarLocalDate(calendarType: CalendarType, date: ParsedDate, isLeapMonth: boolean): ParsedDate {
  if (calendarType === 'SOLAR') {
    return date;
  }
  try {
    const lunarMonth = isLeapMonth ? -date.month : date.month;
    const solar = Lunar.fromYmdHms(date.year, lunarMonth, date.day, 12, 0, 0).getSolar();
    return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
  } catch {
    throw new Error(`CHART_INVALID_LUNAR_DATE: 农历日期或闰月不合法`);
  }
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
  const warnings: string[] = [];
  const date = parseDate(input.localDate, input.calendarType);
  const time = parseTime(input.localTime);
  const isTimeKnown = time !== null;

  // 未知时辰以正午作为日柱计算的占位时刻，避免子时换日歧义。
  const hour = time?.hour ?? 12;
  const minute = time?.minute ?? 0;

  if (input.calendarType === 'SOLAR' && input.isLeapMonth) {
    throw new Error('CHART_INVALID_LUNAR_DATE: 公历输入不能标记为闰月');
  }
  const solarDate = toSolarLocalDate(input.calendarType, date, input.isLeapMonth);
  const physical: LocalDateTime = { ...solarDate, hour, minute };
  const zoned = resolveZonedDateTime(physical, input.timezoneId);

  let offset = 0;
  if (input.useTrueSolarTime) {
    if (input.longitude === null) {
      warnings.push('TRUE_SOLAR_TIME_WITHOUT_LONGITUDE: 启用真太阳时但缺少经度，已按钟表时间计算');
    } else {
      offset = trueSolarTimeOffsetMinutes({
        longitude: input.longitude,
        utcOffsetMinutes: zoned.utcOffsetMinutes,
        year: solarDate.year,
        month: solarDate.month,
        day: solarDate.day,
      });
    }
  }

  return {
    chartLocalDateTime: shiftMinutes(physical, offset),
    utcInstant: zoned.utcInstant,
    utcOffsetMinutes: zoned.utcOffsetMinutes,
    solarTermDateTime: toZonedLocalDateTime(zoned.utcInstant, 'Asia/Shanghai'),
    trueSolarTimeOffsetMinutes: offset,
    isTimeKnown,
    warnings,
  };
}
