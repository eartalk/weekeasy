import {
  CALENDAR_ADAPTER,
  CALENDAR_ADAPTER_VERSION,
  computeFourPillarIndices,
  resolveBirthInstant,
} from '@weekeasy/bazi-calendar';
import type { PillarIndices } from '@weekeasy/bazi-calendar';
import { branchFromIndex, stemFromIndex } from './stem-branch.js';
import type { ChartCalculationInput, NatalChart, Pillar } from './types.js';

export const ENGINE_VERSION = '0.1.0';
export const CALCULATION_POLICY_VERSION = '0.1.0';

function pillarFromIndices(indices: PillarIndices): Pillar {
  return { stem: stemFromIndex(indices.stem), branch: branchFromIndex(indices.branch) };
}

// 确定性的基础排盘：给定出生输入，产出四柱命盘与边界警告。
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

  return {
    year: pillarFromIndices(pillars.year),
    month: pillarFromIndices(pillars.month),
    day: pillarFromIndices(pillars.day),
    hour: pillars.hour ? pillarFromIndices(pillars.hour) : null,
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
