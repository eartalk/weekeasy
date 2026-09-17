import { describe, expect, it } from 'vitest';
import { scoreLikertAnswer } from './index.js';

describe('scoreLikertAnswer', () => {
  it('reverses a five-point Likert answer', () => {
    expect(scoreLikertAnswer({ value: 2, reverseScored: true })).toBe(4);
  });
});
