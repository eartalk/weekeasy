// 时区与当地时间转换辅助。UTC 偏移必须由 IANA 时区和出生当地时间推导，
// 不能信任客户端提交的当前偏移，否则历史夏令时和节气边界会失真。

export interface LocalDateTime {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number;
  readonly hour: number; // 0-23
  readonly minute: number; // 0-59
}

export function assertIanaTimeZone(timeZone: string): string {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format();
    return timeZone;
  } catch {
    throw new Error(`Invalid IANA time zone: ${timeZone}`);
  }
}

function offsetMinutesAt(timeZone: string, instantMilliseconds: number): number {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(instantMilliseconds)).find((item) => item.type === 'timeZoneName')?.value;
  if (!part || part === 'GMT') return 0;
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(part);
  if (!match) throw new Error(`CHART_INVALID_TIME_ZONE_OFFSET: 无法解析时区偏移「${part}」`);
  const sign = match[1] === '+' ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

export function toZonedLocalDateTime(instant: string, timeZone: string): LocalDateTime {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(instant));
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') };
}

export interface ResolvedZonedDateTime {
  readonly utcInstant: string;
  readonly utcOffsetMinutes: number;
}

// 由当地墙上时间和 IANA 时区解析真实 UTC 时刻，并校验 DST 跳时造成的不存在时间。
export function resolveZonedDateTime(local: LocalDateTime, timeZone: string): ResolvedZonedDateTime {
  assertIanaTimeZone(timeZone);
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  const initialOffset = offsetMinutesAt(timeZone, localAsUtc);
  let instantMilliseconds = localAsUtc - initialOffset * 60_000;
  const resolvedOffset = offsetMinutesAt(timeZone, instantMilliseconds);
  instantMilliseconds = localAsUtc - resolvedOffset * 60_000;
  const utcInstant = new Date(instantMilliseconds).toISOString();
  const roundTrip = toZonedLocalDateTime(utcInstant, timeZone);
  if (Object.keys(local).some((key) => local[key as keyof LocalDateTime] !== roundTrip[key as keyof LocalDateTime])) {
    throw new Error('CHART_INVALID_LOCAL_TIME: 当地时间处于夏令时跳时区间或无法在指定时区中解析');
  }
  return { utcInstant, utcOffsetMinutes: resolvedOffset };
}
