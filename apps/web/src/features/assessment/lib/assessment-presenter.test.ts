import { describe, expect, it } from 'vitest';
import { DIMENSION_PRESENTATION, LIKERT_OPTIONS } from './assessment-presenter.js';

describe('assessment presenter', () => {
  it('提供完整且有序的五点量表', () => {
    expect(LIKERT_OPTIONS.map((option) => option.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it('五个维度均使用连续谱而非人格类型标签', () => {
    expect(Object.keys(DIMENSION_PRESENTATION)).toHaveLength(5);
    expect(DIMENSION_PRESENTATION.NEUROTICISM.description).toContain('不代表心理诊断');
  });
});
