import { Inject, Injectable } from '@nestjs/common';
import {
  assessmentResultResponseSchema,
  type AssessmentAnswer,
  type AssessmentAttemptResponse,
  type AssessmentDefinitionResponse,
  type AssessmentResultResponse,
  type BigFiveDimension,
} from '@weekeasy/api-contracts';
import {
  validateAssessmentDefinition,
  type AssessmentValidityRules,
  type BigFiveAssessmentDefinition,
  type BigFiveAssessmentResult,
} from '@weekeasy/assessment-core';
import { Prisma } from '@weekeasy/database';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import type {
  AssessmentAttemptForScoring,
  AssessmentDefinitionSnapshot,
  AssessmentRepository,
} from '../application/assessment.repository.js';

interface ScoringConfig {
  readonly scale: { readonly minimum: number; readonly maximum: number };
  readonly validityRules: AssessmentValidityRules;
  readonly estimatedMinutes: number;
  readonly source: { readonly name: string; readonly url: string; readonly license: 'public-domain' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseScoringConfig(value: unknown): ScoringConfig {
  if (!isRecord(value) || !isRecord(value.scale) || !isRecord(value.validityRules) || !isRecord(value.source)) {
    throw new Error('ASSESSMENT_INVALID_DEFINITION: scoring_config 结构不合法');
  }
  const config = {
    scale: { minimum: value.scale.minimum, maximum: value.scale.maximum },
    validityRules: {
      minimumCompletionRatio: value.validityRules.minimumCompletionRatio,
      maximumSameAnswerRatio: value.validityRules.maximumSameAnswerRatio,
      minimumDurationSeconds: value.validityRules.minimumDurationSeconds,
    },
    estimatedMinutes: value.estimatedMinutes,
    source: { name: value.source.name, url: value.source.url, license: value.source.license },
  };
  if (
    typeof config.scale.minimum !== 'number' || typeof config.scale.maximum !== 'number' ||
    typeof config.validityRules.minimumCompletionRatio !== 'number' ||
    typeof config.validityRules.maximumSameAnswerRatio !== 'number' ||
    (config.validityRules.minimumDurationSeconds !== undefined && typeof config.validityRules.minimumDurationSeconds !== 'number') ||
    typeof config.estimatedMinutes !== 'number' || typeof config.source.name !== 'string' ||
    typeof config.source.url !== 'string' || config.source.license !== 'public-domain'
  ) {
    throw new Error('ASSESSMENT_INVALID_DEFINITION: scoring_config 字段不合法');
  }
  return config as ScoringConfig;
}

const definitionInclude = { questions: { orderBy: { position: 'asc' as const } } } as const;
const attemptInclude = {
  definition: { include: definitionInclude },
  answers: { orderBy: { answeredAt: 'asc' as const } },
} as const;

type StoredDefinition = {
  id: string;
  code: string;
  version: string;
  title: string;
  scoringConfig: unknown;
  questions: Array<{
    id: string;
    code: string;
    position: number;
    prompt: string;
    dimension: string;
    reverseScored: boolean;
    weight: Prisma.Decimal;
  }>;
};

type StoredAttempt = {
  id: string;
  profileId: string;
  status: AssessmentAttemptResponse['status'];
  startedAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  definition: StoredDefinition;
  answers: Array<{ questionId: string; value: number }>;
};

function toDefinition(definition: StoredDefinition): AssessmentDefinitionSnapshot {
  const config = parseScoringConfig(definition.scoringConfig);
  const scoringDefinition: BigFiveAssessmentDefinition = {
    code: definition.code,
    version: definition.version,
    scale: config.scale,
    validityRules: config.validityRules,
    questions: definition.questions.map((question) => ({
      code: question.code,
      dimension: question.dimension as BigFiveDimension,
      reverseScored: question.reverseScored,
      weight: Number(question.weight),
    })),
  };
  validateAssessmentDefinition(scoringDefinition);
  const response: AssessmentDefinitionResponse = {
    id: definition.id,
    code: 'BIG_FIVE_MINI_IPIP',
    version: definition.version,
    title: definition.title,
    scale: config.scale,
    estimatedMinutes: config.estimatedMinutes,
    source: config.source,
    questions: definition.questions.map(({ id, code, position, prompt }) => ({ id, code, position, prompt })),
  };
  return {
    response,
    scoringDefinition,
    questionCodesById: new Map(definition.questions.map((question) => [question.id, question.code])),
  };
}

function toAttempt(attempt: StoredAttempt): AssessmentAttemptResponse {
  return {
    id: attempt.id,
    profileId: attempt.profileId,
    status: attempt.status,
    definition: toDefinition(attempt.definition).response,
    answers: attempt.answers.map((answer) => ({ questionId: answer.questionId, value: answer.value })),
    startedAt: attempt.startedAt.toISOString(),
    updatedAt: attempt.updatedAt.toISOString(),
    completedAt: attempt.completedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class PrismaAssessmentRepository implements AssessmentRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findCurrentDefinition(): Promise<AssessmentDefinitionSnapshot | null> {
    const definition = await this.database.client.assessmentDefinition.findFirst({
      where: { code: 'BIG_FIVE_MINI_IPIP', status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      include: definitionInclude,
    });
    return definition ? toDefinition(definition) : null;
  }

  async startOrResumeOwned(
    guestSessionId: string,
    profileId: string,
    definitionId: string,
  ): Promise<AssessmentAttemptResponse | null> {
    return this.database.client.$transaction(async (transaction) => {
      const profile = await transaction.profile.findFirst({
        where: { id: profileId, anonymousId: guestSessionId, deletedAt: null },
        select: { id: true },
      });
      if (!profile) return null;
      const existing = await transaction.assessmentAttempt.findFirst({
        where: { profileId, definitionId, status: 'IN_PROGRESS' },
        orderBy: { updatedAt: 'desc' },
        include: attemptInclude,
      });
      if (existing) return toAttempt(existing);
      const created = await transaction.assessmentAttempt.create({
        data: { profileId, definitionId },
        include: attemptInclude,
      });
      return toAttempt(created);
    });
  }

  async saveAnswersOwned(
    guestSessionId: string,
    profileId: string,
    attemptId: string,
    answers: readonly AssessmentAnswer[],
  ): Promise<AssessmentAttemptResponse | null> {
    return this.database.client.$transaction(async (transaction) => {
      const attempt = await transaction.assessmentAttempt.findFirst({
        where: { id: attemptId, profileId, status: 'IN_PROGRESS', profile: { anonymousId: guestSessionId, deletedAt: null } },
        select: { id: true, definitionId: true },
      });
      if (!attempt) return null;
      const questionCount = await transaction.assessmentQuestion.count({
        where: { definitionId: attempt.definitionId, id: { in: answers.map((answer) => answer.questionId) } },
      });
      if (questionCount !== answers.length) return null;
      await Promise.all(answers.map((answer) => transaction.assessmentAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
        create: { attemptId, questionId: answer.questionId, value: answer.value },
        update: { value: answer.value, answeredAt: new Date() },
      })));
      const updated = await transaction.assessmentAttempt.update({
        where: { id: attemptId },
        data: { updatedAt: new Date() },
        include: attemptInclude,
      });
      return toAttempt(updated);
    });
  }

  async findForScoringOwned(
    guestSessionId: string,
    profileId: string,
    attemptId: string,
  ): Promise<AssessmentAttemptForScoring | null> {
    const attempt = await this.database.client.assessmentAttempt.findFirst({
      where: { id: attemptId, profileId, profile: { anonymousId: guestSessionId, deletedAt: null } },
      include: attemptInclude,
    });
    return attempt ? { attempt: toAttempt(attempt), definition: toDefinition(attempt.definition) } : null;
  }

  async completeOwned(
    guestSessionId: string,
    profileId: string,
    attemptId: string,
    answers: readonly AssessmentAnswer[],
    result: BigFiveAssessmentResult,
    completedAt: Date,
  ): Promise<AssessmentResultResponse | null> {
    return this.database.client.$transaction(async (transaction) => {
      const attempt = await transaction.assessmentAttempt.findFirst({
        where: { id: attemptId, profileId, status: 'IN_PROGRESS', profile: { anonymousId: guestSessionId, deletedAt: null } },
        select: { id: true, definitionId: true },
      });
      if (!attempt) return null;
      const questionCount = await transaction.assessmentQuestion.count({
        where: { definitionId: attempt.definitionId, id: { in: answers.map((answer) => answer.questionId) } },
      });
      if (questionCount !== answers.length) return null;
      await Promise.all(answers.map((answer) => transaction.assessmentAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
        create: { attemptId, questionId: answer.questionId, value: answer.value, answeredAt: completedAt },
        update: { value: answer.value, answeredAt: completedAt },
      })));
      const status = result.validity.isValid ? 'COMPLETED' : 'INVALID';
      await transaction.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          resultData: {
            definitionCode: result.definitionCode,
            definitionVersion: result.definitionVersion,
            dimensions: result.dimensions,
            dataCompleteness: result.dataCompleteness,
          } as unknown as Prisma.InputJsonValue,
          validityData: result.validity as unknown as Prisma.InputJsonValue,
          completedAt,
          updatedAt: completedAt,
        },
      });
      return assessmentResultResponseSchema.parse({
        attemptId,
        profileId,
        status,
        ...result,
        completedAt: completedAt.toISOString(),
      });
    });
  }

  async findLatestResultOwned(
    guestSessionId: string,
    profileId: string,
  ): Promise<AssessmentResultResponse | null> {
    const attempt = await this.database.client.assessmentAttempt.findFirst({
      where: {
        profileId,
        status: { in: ['COMPLETED', 'INVALID'] },
        resultData: { not: Prisma.JsonNull },
        validityData: { not: Prisma.JsonNull },
        profile: { anonymousId: guestSessionId, deletedAt: null },
      },
      orderBy: { completedAt: 'desc' },
      select: { id: true, profileId: true, status: true, resultData: true, validityData: true, completedAt: true },
    });
    if (!attempt?.completedAt || !isRecord(attempt.resultData) || !isRecord(attempt.validityData)) return null;
    return assessmentResultResponseSchema.parse({
      attemptId: attempt.id,
      profileId: attempt.profileId,
      status: attempt.status,
      ...attempt.resultData,
      validity: attempt.validityData,
      completedAt: attempt.completedAt.toISOString(),
    });
  }
}
