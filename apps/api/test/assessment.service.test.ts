import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AssessmentAttemptResponse } from '@weekeasy/api-contracts';
import type { BigFiveAssessmentDefinition } from '@weekeasy/assessment-core';
import type {
  AssessmentDefinitionSnapshot,
  AssessmentRepository,
} from '../src/modules/assessments/application/assessment.repository.js';
import { AssessmentService } from '../src/modules/assessments/application/assessment.service.js';

const profileId = '01993f2e-8100-7000-8000-000000000001';
const attemptId = '01993f2e-8100-7000-8200-000000000001';
const dimensions = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'] as const;
const scoringDefinition: BigFiveAssessmentDefinition = {
  code: 'BIG_FIVE_MINI_IPIP',
  version: '1.0.0-zh-CN',
  scale: { minimum: 1, maximum: 5 },
  validityRules: { minimumCompletionRatio: 1, maximumSameAnswerRatio: 1, minimumDurationSeconds: 1 },
  questions: dimensions.map((dimension, index) => ({ code: `Q${index + 1}`, dimension, reverseScored: false })),
};
const questions = dimensions.map((_, index) => ({
  id: `01993f2e-8100-7000-8100-00000000000${index + 1}`,
  code: `Q${index + 1}`,
  position: index + 1,
  prompt: `题目 ${index + 1}`,
}));
const definition: AssessmentDefinitionSnapshot = {
  response: {
    id: '01993f2e-8100-7000-8000-000000000200',
    code: 'BIG_FIVE_MINI_IPIP',
    version: '1.0.0-zh-CN',
    title: 'Mini-IPIP 简版大五人格测评',
    scale: { minimum: 1, maximum: 5 },
    estimatedMinutes: 4,
    source: { name: 'Mini-IPIP', url: 'https://ipip.ori.org/MiniIPIPKey.htm', license: 'public-domain' },
    questions,
  },
  scoringDefinition,
  questionCodesById: new Map(questions.map((question) => [question.id, question.code])),
};
const attempt: AssessmentAttemptResponse = {
  id: attemptId,
  profileId,
  status: 'IN_PROGRESS',
  definition: definition.response,
  answers: [],
  startedAt: new Date(Date.now() - 90_000).toISOString(),
  updatedAt: new Date(Date.now() - 90_000).toISOString(),
  completedAt: null,
};

function createRepository(): AssessmentRepository {
  return {
    findCurrentDefinition: vi.fn(async () => definition),
    startOrResumeOwned: vi.fn(async () => attempt),
    saveAnswersOwned: vi.fn(async () => attempt),
    findForScoringOwned: vi.fn(async () => ({ attempt, definition })),
    completeOwned: vi.fn(async (_guest, _profile, _attempt, _answers, result, completedAt) => ({
      attemptId,
      profileId,
      status: result.validity.isValid ? 'COMPLETED' : 'INVALID',
      ...result,
      completedAt: completedAt.toISOString(),
    })),
    findLatestResultOwned: vi.fn(async () => null),
  };
}

describe('AssessmentService', () => {
  it('开始时恢复当前版本的进行中答卷', async () => {
    const repository = createRepository();
    const service = new AssessmentService(repository);
    await expect(service.start('guest-1', profileId)).resolves.toEqual(attempt);
    expect(repository.startOrResumeOwned).toHaveBeenCalledWith('guest-1', profileId, definition.response.id);
  });

  it('完成全部答案后生成带版本和有效性的结果快照', async () => {
    const repository = createRepository();
    const service = new AssessmentService(repository);
    const answers = questions.map((question, index) => ({ questionId: question.id, value: index + 1 }));
    const result = await service.complete('guest-1', profileId, attemptId, { answers });
    expect(result).toMatchObject({
      status: 'COMPLETED',
      definitionVersion: '1.0.0-zh-CN',
      dataCompleteness: 1,
      validity: { isValid: true },
    });
    expect(repository.completeOwned).toHaveBeenCalledTimes(1);
  });

  it('拒绝把未完成答卷固化为正式结果', async () => {
    const service = new AssessmentService(createRepository());
    await expect(service.complete('guest-1', profileId, attemptId, {
      answers: [{ questionId: questions[0]!.id, value: 3 }],
    })).rejects.toMatchObject({
      constructor: BadRequestException,
      response: { code: 'ASSESSMENT_INCOMPLETE_ANSWERS' },
    });
  });

  it('对不存在或无权访问的答卷统一返回 404', async () => {
    const repository = createRepository();
    vi.mocked(repository.findForScoringOwned).mockResolvedValue(null);
    const service = new AssessmentService(repository);
    await expect(service.complete('another-guest', profileId, attemptId, { answers: [] })).rejects.toMatchObject({
      constructor: NotFoundException,
      response: { code: 'ASSESSMENT_NOT_FOUND' },
    });
  });
});
