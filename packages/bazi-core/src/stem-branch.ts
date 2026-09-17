export const HEAVENLY_STEMS = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
] as const;

export const EARTHLY_BRANCHES = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;

export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];

export function stemFromIndex(index: number): HeavenlyStem {
  const stem = HEAVENLY_STEMS[index];
  if (!stem) {
    throw new Error(`CHART_UNKNOWN_STEM_INDEX: 天干索引越界「${index}」`);
  }
  return stem;
}

export function branchFromIndex(index: number): EarthlyBranch {
  const branch = EARTHLY_BRANCHES[index];
  if (!branch) {
    throw new Error(`CHART_UNKNOWN_BRANCH_INDEX: 地支索引越界「${index}」`);
  }
  return branch;
}
