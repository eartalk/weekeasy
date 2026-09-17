import type { EarthlyBranch } from './stem-branch.js';

// 地支刑冲合害：两两及三合关系，供命盘结构展示与规则引擎使用。

export type PillarPosition = 'year' | 'month' | 'day' | 'hour';
export type RelationKind = 'clash' | 'combination' | 'tripleCombination' | 'harm' | 'punishment';

export interface PillarRelation {
  readonly kind: RelationKind;
  readonly positions: readonly PillarPosition[];
}

// 六冲。
const CLASHES: readonly (readonly [EarthlyBranch, EarthlyBranch])[] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

// 六合。
const COMBINATIONS: readonly (readonly [EarthlyBranch, EarthlyBranch])[] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

// 六害。
const HARMS: readonly (readonly [EarthlyBranch, EarthlyBranch])[] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

// 三刑：寅巳申（无恩之刑）、丑戌未（恃势之刑）、子卯（无礼之刑）。
const PUNISHMENTS: readonly (readonly [EarthlyBranch, EarthlyBranch])[] = [
  ['寅', '巳'], ['巳', '申'], ['申', '寅'],
  ['丑', '戌'], ['戌', '未'], ['未', '丑'],
  ['子', '卯'],
];

// 自刑：辰、午、酉、亥自身相刑。
const SELF_PUNISHMENTS: readonly EarthlyBranch[] = ['辰', '午', '酉', '亥'];

// 三合局：申子辰合水、亥卯未合木、寅午戌合火、巳酉丑合金。
const TRIPLE_COMBINATIONS: readonly (readonly [EarthlyBranch, EarthlyBranch, EarthlyBranch])[] = [
  ['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑'],
];

export interface PositionedBranch {
  readonly position: PillarPosition;
  readonly branch: EarthlyBranch;
}

function contains(pair: readonly [EarthlyBranch, EarthlyBranch], a: EarthlyBranch, b: EarthlyBranch): boolean {
  return (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a);
}

function relationBetween(a: EarthlyBranch, b: EarthlyBranch): readonly RelationKind[] {
  const kinds: RelationKind[] = [];
  if (CLASHES.some((pair) => contains(pair, a, b))) kinds.push('clash');
  if (COMBINATIONS.some((pair) => contains(pair, a, b))) kinds.push('combination');
  if (HARMS.some((pair) => contains(pair, a, b))) kinds.push('harm');
  if (PUNISHMENTS.some((pair) => contains(pair, a, b))) kinds.push('punishment');
  return kinds;
}

// 计算四个地支之间存在的刑冲合害关系；未知时柱以 null 表示、不参与。
export function computeBranchRelations(
  pillars: readonly (PositionedBranch | null)[],
): readonly PillarRelation[] {
  const present = pillars.filter(
    (p): p is PositionedBranch => p !== null,
  );
  const relations: PillarRelation[] = [];

  for (let i = 0; i < present.length; i++) {
    const left = present[i];
    if (!left) continue;
    for (let j = i + 1; j < present.length; j++) {
      const right = present[j];
      if (!right) continue;
      for (const kind of relationBetween(left.branch, right.branch)) {
        relations.push({ kind, positions: [left.position, right.position] });
      }
    }
  }

  // 自刑：同一地支在多个柱出现。
  for (const branch of SELF_PUNISHMENTS) {
    const matched = present.filter((p) => p.branch === branch).map((p) => p.position);
    if (matched.length >= 2) {
      relations.push({ kind: 'punishment', positions: matched });
    }
  }

  // 三合：三柱地支齐全。
  for (const triple of TRIPLE_COMBINATIONS) {
    const matched = triple
      .map((branch) => present.find((p) => p.branch === branch))
      .filter((p): p is PositionedBranch => p !== undefined);
    if (matched.length === 3) {
      relations.push({ kind: 'tripleCombination', positions: matched.map((p) => p.position) });
    }
  }

  return relations;
}
