import { describe, expect, it } from 'vitest';
import {
  AssessmentScoringError,
  scoreBigFiveAssessment,
  scoreLikertAnswer,
  validateAssessmentDefinition,
  type BigFiveAssessmentDefinition,
} from './index.js';

const definition: BigFiveAssessmentDefinition = {
  code: 'BIG_FIVE_TEST',
  version: '1.0.0',
  scale: { minimum: 1, maximum: 5 },
  validityRules: {
    minimumCompletionRatio: 1,
    maximumSameAnswerRatio: 0.8,
    minimumDurationSeconds: 30,
  },
  questions: [
    { code: 'O1', dimension: 'OPENNESS', reverseScored: false },
    { code: 'O2', dimension: 'OPENNESS', reverseScored: true },
    { code: 'C1', dimension: 'CONSCIENTIOUSNESS', reverseScored: false },
    { code: 'E1', dimension: 'EXTRAVERSION', reverseScored: false, weight: 2 },
    { code: 'A1', dimension: 'AGREEABLENESS', reverseScored: false },
    { code: 'N1', dimension: 'NEUROTICISM', reverseScored: true },
  ],
};

const completeAnswers = [
  { questionCode: 'O1', value: 5 },
  { questionCode: 'O2', value: 2 },
  { questionCode: 'C1', value: 4 },
  { questionCode: 'E1', value: 3 },
  { questionCode: 'A1', value: 4 },
  { questionCode: 'N1', value: 5 },
] as const;

describe('scoreLikertAnswer', () => {
  it('按量表上下限执行反向计分和权重', () => {
    expect(scoreLikertAnswer({ value: 2, reverseScored: true, weight: 1.5 })).toBe(6);
    expect(scoreLikertAnswer({ value: 1, reverseScored: true }, { minimum: 0, maximum: 4 })).toBe(3);
  });

  it('拒绝量表范围外或非整数答案', () => {
    for (const value of [0, 6, 2.5]) {
      expect(() => scoreLikertAnswer({ value, reverseScored: false })).toThrowError(
        expect.objectContaining({ code: 'ASSESSMENT_INVALID_ANSWER' }),
      );
    }
  });
});

describe('validateAssessmentDefinition', () => {
  it('接受覆盖五个维度的版本化定义', () => {
    expect(() => validateAssessmentDefinition(definition)).not.toThrow();
  });

  it('拒绝重复题目代码和缺失维度', () => {
    const questions = definition.questions.filter((question) => question.dimension !== 'NEUROTICISM');
    expect(() => validateAssessmentDefinition({ ...definition, questions })).toThrow(/缺少维度/);
    expect(() => validateAssessmentDefinition({
      ...definition,
      questions: [...definition.questions, definition.questions[0]!],
    })).toThrow(/题目代码重复/);
  });

  it('拒绝非法量表、权重和有效性阈值', () => {
    expect(() => validateAssessmentDefinition({ ...definition, scale: { minimum: 5, maximum: 1 } })).toThrow();
    expect(() => validateAssessmentDefinition({
      ...definition,
      questions: definition.questions.map((question, index) => index === 0 ? { ...question, weight: 0 } : question),
    })).toThrow(/权重/);
    expect(() => validateAssessmentDefinition({
      ...definition,
      validityRules: { ...definition.validityRules, minimumCompletionRatio: 1.1 },
    })).toThrow(/最低完整度/);
  });
});

describe('scoreBigFiveAssessment', () => {
  it('输出五维原始均分、标准分和版本快照', () => {
    const result = scoreBigFiveAssessment(definition, completeAnswers, { durationSeconds: 90 });
    expect(result).toMatchObject({
      definitionCode: 'BIG_FIVE_TEST',
      definitionVersion: '1.0.0',
      dataCompleteness: 1,
      validity: { isValid: true, issues: [], durationSeconds: 90 },
    });
    expect(result.dimensions.OPENNESS).toEqual({
      rawScore: 4.5,
      normalizedScore: 87.5,
      answeredQuestions: 2,
      totalQuestions: 2,
    });
    expect(result.dimensions.NEUROTICISM.normalizedScore).toBe(0);
  });

  it('允许保存部分答卷，并明确标记完整度不足', () => {
    const result = scoreBigFiveAssessment(definition, completeAnswers.slice(0, 3));
    expect(result.dataCompleteness).toBe(0.5);
    expect(result.validity).toMatchObject({ isValid: false, issues: ['INCOMPLETE_ANSWERS'] });
    expect(result.dimensions.EXTRAVERSION.rawScore).toBeNull();
  });

  it('识别同值作答和过短用时', () => {
    const answers = definition.questions.map((question) => ({ questionCode: question.code, value: 3 }));
    const result = scoreBigFiveAssessment(definition, answers, { durationSeconds: 10 });
    expect(result.validity.issues).toEqual(['STRAIGHT_LINING', 'TOO_FAST']);
    expect(result.validity.sameAnswerRatio).toBe(1);
  });

  it('拒绝未知题目和重复作答', () => {
    expect(() => scoreBigFiveAssessment(definition, [{ questionCode: 'UNKNOWN', value: 3 }])).toThrowError(
      expect.objectContaining({ code: 'ASSESSMENT_UNKNOWN_QUESTION' }),
    );
    expect(() => scoreBigFiveAssessment(definition, [completeAnswers[0], completeAnswers[0]])).toThrowError(
      expect.objectContaining({ code: 'ASSESSMENT_DUPLICATE_ANSWER' }),
    );
  });

  it('错误对象携带稳定代码', () => {
    try {
      scoreBigFiveAssessment(definition, [{ questionCode: 'O1', value: 8 }]);
      expect.fail('应抛出计分错误');
    } catch (error) {
      expect(error).toBeInstanceOf(AssessmentScoringError);
      expect(error).toMatchObject({ code: 'ASSESSMENT_INVALID_ANSWER' });
    }
  });
});
