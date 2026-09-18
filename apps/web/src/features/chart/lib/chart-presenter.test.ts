import { describe, expect, it } from 'vitest';
import type { ChartResponse } from '@weekeasy/api-contracts';
import { countSurfaceElements, positionLabel, presentPillars, relationLabel } from './chart-presenter';

const chart = {
  chartData: {
    year: { stem: '甲', branch: '子', stemElement: '木', branchElement: '水' },
    month: { stem: '丙', branch: '寅', stemElement: '火', branchElement: '木' },
    day: { stem: '戊', branch: '辰', stemElement: '土', branchElement: '土' },
    hour: null,
    relations: [],
  },
} as unknown as ChartResponse;

describe('chart presenter', () => {
  it('未知时辰仍保留四柱位置并返回空时柱', () => {
    const pillars = presentPillars(chart);
    expect(pillars).toHaveLength(4);
    expect(pillars[3]).toMatchObject({ key: 'hour', label: '时柱', detail: null });
  });

  it('只统计已知柱的天干和地支表层五行', () => {
    expect(countSurfaceElements(chart)).toEqual({ 木: 2, 火: 1, 土: 2, 金: 0, 水: 1 });
  });

  it('把结构代码转换为用户可读标签并保留未知值', () => {
    expect(relationLabel('tripleCombination')).toBe('三合');
    expect(positionLabel('day')).toBe('日柱');
    expect(relationLabel('futureKind')).toBe('futureKind');
  });
});
