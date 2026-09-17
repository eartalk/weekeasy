import type { ChartResponse } from '@weekeasy/api-contracts';

export const CHART_REPOSITORY = Symbol('CHART_REPOSITORY');

export interface SaveChartInput {
  profileId: string;
  birthRecordId: string;
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
  calculationHash: string;
}

export interface ChartRepository {
  save(input: SaveChartInput): Promise<ChartResponse>;
  findLatestOwned(guestSessionId: string, profileId: string): Promise<ChartResponse | null>;
}
