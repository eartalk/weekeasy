import type { ChartResponse } from '@weekeasy/api-contracts';

export const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'] as const;

export type ElementName = (typeof FIVE_ELEMENTS)[number];
export type PillarKey = keyof Pick<ChartResponse['chartData'], 'year' | 'month' | 'day' | 'hour'>;

export interface PresentedPillar {
  readonly key: PillarKey;
  readonly label: string;
  readonly detail: ChartResponse['chartData']['year'] | null;
}

const PILLAR_LABELS: Record<PillarKey, string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱 · 日主',
  hour: '时柱',
};

const POSITION_LABELS: Record<string, string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  hour: '时柱',
};

const RELATION_LABELS: Record<string, string> = {
  clash: '冲',
  combination: '六合',
  tripleCombination: '三合',
  harm: '害',
  punishment: '刑',
};

export function presentPillars(chart: ChartResponse): readonly PresentedPillar[] {
  return (['year', 'month', 'day', 'hour'] as const).map((key) => ({
    key,
    label: PILLAR_LABELS[key],
    detail: chart.chartData[key],
  }));
}

// 仅统计四柱天干与地支的表层五行，不把藏干权重混入展示。
export function countSurfaceElements(chart: ChartResponse): Record<ElementName, number> {
  const counts: Record<ElementName, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const pillar of presentPillars(chart)) {
    if (!pillar.detail) continue;
    for (const element of [pillar.detail.stemElement, pillar.detail.branchElement]) {
      if (FIVE_ELEMENTS.includes(element as ElementName)) {
        counts[element as ElementName] += 1;
      }
    }
  }
  return counts;
}

export function relationLabel(kind: string): string {
  return RELATION_LABELS[kind] ?? kind;
}

export function positionLabel(position: string): string {
  return POSITION_LABELS[position] ?? position;
}
