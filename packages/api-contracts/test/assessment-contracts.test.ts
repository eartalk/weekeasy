import { describe, expect, it } from 'vitest';
import {
  assessmentDefinitionResponseSchema,
  assessmentResultResponseSchema,
  saveAssessmentAnswersRequestSchema,
} from '../src/index.js';

const questionId = '01993f2e-8100-7000-8100-000000000001';

describe('assessment contracts', () => {
  it('校验发布后的简版题库响应', () => {
    expect(assessmentDefinitionResponseSchema.safeParse({
      id: '01993f2e-8100-7000-8000-000000000200',
      code: 'BIG_FIVE_MINI_IPIP',
      version: '1.0.0-zh-CN',
      title: 'Mini-IPIP 简版大五人格测评',
      scale: { minimum: 1, maximum: 5 },
      estimatedMinutes: 4,
      source: { name: 'Mini-IPIP', url: 'https://ipip.ori.org/MiniIPIPKey.htm', license: 'public-domain' },
      questions: [{ id: questionId, code: 'MINI_IPIP_01', position: 1, prompt: '我是聚会中的活跃人物。' }],
    }).success).toBe(true);
  });

  it('拒绝重复题目和量表范围外答案', () => {
    expect(saveAssessmentAnswersRequestSchema.safeParse({
      answers: [{ questionId, value: 3 }, { questionId, value: 4 }],
    }).success).toBe(false);
    expect(saveAssessmentAnswersRequestSchema.safeParse({
      answers: [{ questionId, value: 6 }],
    }).success).toBe(false);
  });

  it('要求结果包含五个维度和有效性证据', () => {
    const score = { rawScore: 3, normalizedScore: 50, answeredQuestions: 4, totalQuestions: 4 };
    expect(assessmentResultResponseSchema.safeParse({
      attemptId: '01993f2e-8100-7000-8200-000000000001',
      profileId: '01993f2e-8100-7000-8000-000000000001',
      status: 'COMPLETED',
      definitionCode: 'BIG_FIVE_MINI_IPIP',
      definitionVersion: '1.0.0-zh-CN',
      dimensions: {
        OPENNESS: score,
        CONSCIENTIOUSNESS: score,
        EXTRAVERSION: score,
        AGREEABLENESS: score,
        NEUROTICISM: score,
      },
      dataCompleteness: 1,
      validity: { isValid: true, completionRatio: 1, sameAnswerRatio: 0.4, durationSeconds: 180, issues: [] },
      completedAt: '2026-09-18T02:00:00.000Z',
    }).success).toBe(true);
  });
});
