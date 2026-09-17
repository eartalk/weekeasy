import { describe, expect, it } from 'vitest';
import { formatPillar } from './index.js';

describe('formatPillar', () => {
  it('joins the stem and branch', () => {
    expect(formatPillar({ stem: '甲', branch: '子' })).toBe('甲子');
  });
});
