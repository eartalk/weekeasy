// 真太阳时修正：真太阳时 = 钟表时间 + 经度修正 + 均时差。
// 均时差采用 NOAA 近似公式，精度约 30 秒，足以支撑 2 小时粒度的时辰判定。

function dayOfYear(year: number, month: number, day: number): number {
  // 用 UTC 计算年内序数，避免运行环境本地时区干扰。
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86_400_000) + 1;
}

// 均时差（分钟），正值表示真太阳时领先钟表时间。
// 采用常用近似式 E = 9.87·sin(2B) − 7.53·cos(B) − 1.5·sin(B)，精度约 30 秒。
export function equationOfTimeMinutes(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day);
  const b = ((360 / 365) * (n - 81) * Math.PI) / 180;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

export interface TrueSolarTimeOptions {
  readonly longitude: number;
  readonly utcOffsetMinutes: number;
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

// 真太阳时修正分钟 = 经度修正 + 均时差。经度以时区中央经线为基准。
export function trueSolarTimeOffsetMinutes(options: TrueSolarTimeOptions): number {
  const standardMeridian = (options.utcOffsetMinutes / 60) * 15;
  const longitudeCorrection = (options.longitude - standardMeridian) * 4;
  return longitudeCorrection + equationOfTimeMinutes(options.year, options.month, options.day);
}
