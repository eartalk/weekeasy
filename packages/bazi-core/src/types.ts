import type { EarthlyBranch, HeavenlyStem } from './stem-branch.js';

export interface Pillar {
  readonly stem: HeavenlyStem;
  readonly branch: EarthlyBranch;
}

export type CalendarType = 'SOLAR' | 'LUNAR';
export type BirthTimePrecision = 'MINUTE' | 'HOUR' | 'UNKNOWN_HOUR';
export type DayBoundaryRule = 'MIDNIGHT' | 'LATE_ZI_HOUR';

// 排盘引擎输入，与出生记录字段一一对应，保持无框架依赖。
export interface ChartCalculationInput {
  readonly calendarType: CalendarType;
  readonly precision: BirthTimePrecision;
  readonly localDate: string; // YYYY-MM-DD
  readonly localTime: string | null; // HH:mm，未知时辰为 null
  readonly timezoneId: string; // IANA 时区
  readonly utcOffsetMinutes: number;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly useTrueSolarTime: boolean;
  readonly dayBoundaryRule: DayBoundaryRule;
}

// 基础命盘：仅四柱与元数据；藏干/十神/五行/刑冲合害留待后续扩展。
export interface NatalChart {
  readonly year: Pillar;
  readonly month: Pillar;
  readonly day: Pillar;
  readonly hour: Pillar | null;
  readonly engineVersion: string;
  readonly warnings: readonly string[];
}

export function formatPillar(pillar: Pillar): string {
  return `${pillar.stem}${pillar.branch}`;
}
