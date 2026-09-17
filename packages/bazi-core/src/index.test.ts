import { describe, expect, it } from 'vitest';
import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  calculateNatalChart,
  formatPillar,
} from './index.js';

describe('formatPillar', () => {
  it('joins the stem and branch', () => {
    expect(formatPillar({ stem: '甲', branch: '子' })).toBe('甲子');
  });
});

describe('对外导出', () => {
  it('导出天干地支常量与排盘引擎', () => {
    expect(HEAVENLY_STEMS).toHaveLength(10);
    expect(EARTHLY_BRANCHES).toHaveLength(12);
    expect(typeof calculateNatalChart).toBe('function');
  });
});
