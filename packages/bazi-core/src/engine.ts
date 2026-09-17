import {
  CALENDAR_ADAPTER,
  CALENDAR_ADAPTER_VERSION,
  computeFourPillarIndices,
  resolveBirthInstant,
} from '@weekeasy/bazi-calendar';
import type { PillarIndices } from '@weekeasy/bazi-calendar';
import { branchFromIndex, stemFromIndex, type HeavenlyStem } from './stem-branch.js';
import { branchElement, branchYinYang, stemElement, stemYinYang } from './elements.js';
import { hiddenStemsOf } from './hidden-stems.js';
import { tenGod } from './ten-gods.js';
import { computeBranchRelations, type PositionedBranch } from './relations.js';
import type {
  ChartCalculationInput,
  HiddenStem,
  NatalChart,
  PillarDetail,
} from './types.js';

export const ENGINE_VERSION = '0.2.0';
export const CALCULATION_POLICY_VERSION = '0.1.0';

function toPillarDetail(
  indices: PillarIndices,
  dayStem: HeavenlyStem,
  isDayMaster: boolean,
): PillarDetail {
  const stem = stemFromIndex(indices.stem);
  const branch = branchFromIndex(indices.branch);
  const hiddenStems: readonly HiddenStem[] = hiddenStemsOf(branch).map((hidden) => ({
    stem: hidden,
    element: stemElement(hidden),
    tenGod: tenGod(dayStem, hidden),
  }));
  return {
    stem,
    branch,
    stemElement: stemElement(stem),
    branchElement: branchElement(branch),
    stemYinYang: stemYinYang(stem),
    branchYinYang: branchYinYang(branch),
    hiddenStems,
    stemTenGod: isDayMaster ? null : tenGod(dayStem, stem),
  };
}

// 确定性的基础排盘：给定出生输入，产出四柱命盘（含藏干、五行、十神、刑冲合害）与边界警告。
export function calculateNatalChart(input: ChartCalculationInput): NatalChart {
  const resolved = resolveBirthInstant({
    calendarType: input.calendarType,
    localDate: input.localDate,
    localTime: input.localTime,
    timezoneId: input.timezoneId,
    utcOffsetMinutes: input.utcOffsetMinutes,
    latitude: input.latitude,
    longitude: input.longitude,
    useTrueSolarTime: input.useTrueSolarTime,
  });

  const pillars = computeFourPillarIndices(resolved, input.dayBoundaryRule);
  const warnings: string[] = [...resolved.warnings];

  if (pillars.hour === null) {
    warnings.push('UNKNOWN_HOUR: 缺少出生时辰，仅计算年、月、日三柱');
  }

  // 晚子时（23:00-24:00）是换日规则最敏感区间，提示用户结果对规则敏感。
  if (resolved.isTimeKnown && resolved.chartLocalDateTime.hour === 23) {
    warnings.push(
      `LATE_ZI_HOUR: 出生时间处于晚子时，日柱按「${input.dayBoundaryRule}」策略计算`,
    );
  }

  const dayStem = stemFromIndex(pillars.day.stem);
  const year = toPillarDetail(pillars.year, dayStem, false);
  const month = toPillarDetail(pillars.month, dayStem, false);
  const day = toPillarDetail(pillars.day, dayStem, true);
  const hour = pillars.hour ? toPillarDetail(pillars.hour, dayStem, false) : null;

  const positionedBranches: readonly (PositionedBranch | null)[] = [
    { position: 'year', branch: year.branch },
    { position: 'month', branch: month.branch },
    { position: 'day', branch: day.branch },
    hour ? { position: 'hour', branch: hour.branch } : null,
  ];

  return {
    year,
    month,
    day,
    hour,
    relations: computeBranchRelations(positionedBranches),
    engineVersion: ENGINE_VERSION,
    warnings,
  };
}

// 引擎与历法适配器的版本信息，供命盘快照记录。
export const CHART_VERSION_INFO = {
  engineVersion: ENGINE_VERSION,
  calendarAdapter: CALENDAR_ADAPTER,
  calendarAdapterVersion: CALENDAR_ADAPTER_VERSION,
  calculationPolicyVersion: CALCULATION_POLICY_VERSION,
} as const;
