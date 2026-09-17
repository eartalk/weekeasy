// 时区与当地时间转换辅助。排盘只依赖输入快照 utcOffsetMinutes，
// 不做历史 DST 反查，与 birth_records.utc_offset_minutes 语义一致。

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

// 由当地日期时间与 UTC 偏移快照构造出生 UTC 时刻（ISO 8601）。
export function toUtcInstant(local: LocalDateTime, utcOffsetMinutes: number): string {
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  return new Date(asUtc - utcOffsetMinutes * 60_000).toISOString();
}
