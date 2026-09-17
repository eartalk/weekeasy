export const HEAVENLY_STEMS = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
] as const;

export const EARTHLY_BRANCHES = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;

export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];

export interface Pillar {
  readonly stem: HeavenlyStem;
  readonly branch: EarthlyBranch;
}

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
