import { describe, expect, it } from 'vitest';
import { computeBranchRelations, type PositionedBranch } from './relations.js';

function positions(branches: readonly (string | null)[]): readonly (PositionedBranch | null)[] {
  const labels = ['year', 'month', 'day', 'hour'] as const;
  return branches.map((branch, index) =>
    branch === null ? null : { position: labels[index], branch: branch as PositionedBranch['branch'] },
  );
}

describe('computeBranchRelations', () => {
  it('六冲', () => {
    const relations = computeBranchRelations(positions(['子', '午', '寅', '卯']));
    expect(relations).toContainEqual({ kind: 'clash', positions: ['year', 'month'] });
  });

  it('六合', () => {
    const relations = computeBranchRelations(positions(['子', '丑', '寅', '卯']));
    expect(relations).toContainEqual({ kind: 'combination', positions: ['year', 'month'] });
  });

  it('六害', () => {
    const relations = computeBranchRelations(positions(['子', '未', '寅', '卯']));
    expect(relations).toContainEqual({ kind: 'harm', positions: ['year', 'month'] });
  });

  it('无礼之刑（子卯）', () => {
    const relations = computeBranchRelations(positions(['子', '卯', '丑', '未']));
    expect(relations).toContainEqual({ kind: 'punishment', positions: ['year', 'month'] });
  });

  it('自刑（两个辰）', () => {
    const relations = computeBranchRelations(positions(['辰', '辰', '子', '卯']));
    expect(relations).toContainEqual({ kind: 'punishment', positions: ['year', 'month'] });
  });

  it('三合局（申子辰）', () => {
    const relations = computeBranchRelations(positions(['申', '子', '辰', '卯']));
    expect(relations).toContainEqual({
      kind: 'tripleCombination',
      positions: ['year', 'month', 'day'],
    });
  });

  it('未知时柱不参与关系', () => {
    const relations = computeBranchRelations(positions(['子', '午', '寅', null]));
    expect(relations).toContainEqual({ kind: 'clash', positions: ['year', 'month'] });
    expect(relations.every((r) => !r.positions.includes('hour'))).toBe(true);
  });

  it('无关系时返回空数组', () => {
    expect(computeBranchRelations(positions(['丑', '卯', '巳', null]))).toEqual([]);
  });
});
