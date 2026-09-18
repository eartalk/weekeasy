import type { ChartResponse } from '@weekeasy/api-contracts';

export const CHART_REPOSITORY = Symbol('CHART_REPOSITORY');

export interface CalculatedChartSnapshot {
  engineVersion: string;
  calendarAdapter: string;
  calendarAdapterVersion: string;
  calculationPolicyVersion: string;
  yearPillar: string | null;
  monthPillar: string | null;
  dayPillar: string | null;
  hourPillar: string | null;
  chartData: unknown;
  warnings: readonly string[];
  utcOffsetMinutes: number;
  adjustedLocalDatetime: string | null;
}

export interface ChartRepository {
  findLatestOwned(guestSessionId: string, profileId: string): Promise<ChartResponse | null>;
}
