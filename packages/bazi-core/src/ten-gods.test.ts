import { describe, expect, it } from 'vitest';
import { tenGod } from './ten-gods.js';

describe('tenGod', () => {
  it('甲日主十神全表', () => {
    expect(tenGod('甲', '甲')).toBe('比肩');
    expect(tenGod('甲', '乙')).toBe('劫财');
    expect(tenGod('甲', '丙')).toBe('食神');
    expect(tenGod('甲', '丁')).toBe('伤官');
    expect(tenGod('甲', '戊')).toBe('偏财');
    expect(tenGod('甲', '己')).toBe('正财');
    expect(tenGod('甲', '庚')).toBe('七杀');
    expect(tenGod('甲', '辛')).toBe('正官');
    expect(tenGod('甲', '壬')).toBe('偏印');
    expect(tenGod('甲', '癸')).toBe('正印');
  });

  it('丙日主十神全表', () => {
    expect(tenGod('丙', '丙')).toBe('比肩');
    expect(tenGod('丙', '丁')).toBe('劫财');
    expect(tenGod('丙', '戊')).toBe('食神');
    expect(tenGod('丙', '己')).toBe('伤官');
    expect(tenGod('丙', '庚')).toBe('偏财');
    expect(tenGod('丙', '辛')).toBe('正财');
    expect(tenGod('丙', '壬')).toBe('七杀');
    expect(tenGod('丙', '癸')).toBe('正官');
    expect(tenGod('丙', '甲')).toBe('偏印');
    expect(tenGod('丙', '乙')).toBe('正印');
  });
});
