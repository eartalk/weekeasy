import type { EarthlyBranch, HeavenlyStem } from './stem-branch.js';
import type { FiveElement, YinYang } from './elements.js';
import type { TenGod } from './ten-gods.js';
import type { PillarRelation } from './relations.js';

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

// 藏干条目：地支所藏天干及其五行、相对日主的十神。
export interface HiddenStem {
  readonly stem: HeavenlyStem;
  readonly element: FiveElement;
  readonly tenGod: TenGod;
}

// 完整柱信息：在干支之上补充五行、阴阳、藏干与十神。
export interface PillarDetail extends Pillar {
  readonly stemElement: FiveElement;
  readonly branchElement: FiveElement;
  readonly stemYinYang: YinYang;
  readonly branchYinYang: YinYang;
  readonly hiddenStems: readonly HiddenStem[];
  // 该柱天干相对日主的十神；日柱天干即日主，值为 null。
  readonly stemTenGod: TenGod | null;
}

// 完整命盘：四柱 + 刑冲合害关系 + 元数据。
export interface NatalChart {
  readonly year: PillarDetail;
  readonly month: PillarDetail;
  readonly day: PillarDetail;
  readonly hour: PillarDetail | null;
  readonly relations: readonly PillarRelation[];
  readonly engineVersion: string;
  readonly warnings: readonly string[];
}

export function formatPillar(pillar: Pillar): string {
  return `${pillar.stem}${pillar.branch}`;
}
