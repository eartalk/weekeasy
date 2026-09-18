import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AssessmentAttemptResponse,
  AssessmentDefinitionResponse,
  AssessmentResultResponse,
  SaveAssessmentAnswersRequest,
} from '@weekeasy/api-contracts';
import { AssessmentScoringError, scoreBigFiveAssessment } from '@weekeasy/assessment-core';
import { ASSESSMENT_REPOSITORY, type AssessmentRepository } from './assessment.repository.js';

@Injectable()
export class AssessmentService {
  constructor(
    @Inject(ASSESSMENT_REPOSITORY)
    private readonly repository: AssessmentRepository,
  ) {}

  async currentDefinition(): Promise<AssessmentDefinitionResponse> {
    const definition = await this.repository.findCurrentDefinition();
    if (!definition) {
      throw new NotFoundException({
        code: 'ASSESSMENT_DEFINITION_NOT_FOUND',
        message: '当前没有可用的测评问卷',
      });
    }
    return definition.response;
  }

  async start(guestSessionId: string, profileId: string): Promise<AssessmentAttemptResponse> {
    const definition = await this.repository.findCurrentDefinition();
    if (!definition) {
      throw new NotFoundException({ code: 'ASSESSMENT_DEFINITION_NOT_FOUND', message: '当前没有可用的测评问卷' });
    }
    const attempt = await this.repository.startOrResumeOwned(guestSessionId, profileId, definition.response.id);
    if (!attempt) throw this.notFound();
    return attempt;
  }

  async save(
    guestSessionId: string,
    profileId: string,
    attemptId: string,
    input: SaveAssessmentAnswersRequest,
  ): Promise<AssessmentAttemptResponse> {
    const attempt = await this.repository.saveAnswersOwned(
      guestSessionId,
      profileId,
      attemptId,
      input.answers,
    );
    if (!attempt) throw this.notFound();
    return attempt;
  }

  async complete(
    guestSessionId: string,
    profileId: string,
    attemptId: string,
    input: SaveAssessmentAnswersRequest,
  ): Promise<AssessmentResultResponse> {
    const stored = await this.repository.findForScoringOwned(guestSessionId, profileId, attemptId);
    if (!stored) throw this.notFound();
    if (stored.attempt.status !== 'IN_PROGRESS') {
      throw new ConflictException({ code: 'ASSESSMENT_ALREADY_FINISHED', message: '这份测评已经结束' });
    }
    if (input.answers.length !== stored.definition.response.questions.length) {
      throw new BadRequestException({
        code: 'ASSESSMENT_INCOMPLETE_ANSWERS',
        message: '请完成全部题目后再提交',
      });
    }

    try {
      const answers = input.answers.map((answer) => {
        const questionCode = stored.definition.questionCodesById.get(answer.questionId);
        if (!questionCode) {
          throw new AssessmentScoringError('ASSESSMENT_UNKNOWN_QUESTION', '提交了不属于当前问卷的题目');
        }
        return { questionCode, value: answer.value };
      });
      const completedAt = new Date();
      const durationSeconds = Math.max(
        0,
        Math.floor((completedAt.getTime() - new Date(stored.attempt.startedAt).getTime()) / 1_000),
      );
      const result = scoreBigFiveAssessment(stored.definition.scoringDefinition, answers, { durationSeconds });
      const completed = await this.repository.completeOwned(
        guestSessionId,
        profileId,
        attemptId,
        input.answers,
        result,
        completedAt,
      );
      if (!completed) throw this.notFound();
      return completed;
    } catch (error) {
      if (error instanceof AssessmentScoringError) {
        throw new BadRequestException({ code: error.code, message: error.message.split(': ').slice(1).join(': ') });
      }
      throw error;
    }
  }

  async latest(guestSessionId: string, profileId: string): Promise<AssessmentResultResponse> {
    const result = await this.repository.findLatestResultOwned(guestSessionId, profileId);
    if (!result) throw this.notFound();
    return result;
  }

  private notFound(): NotFoundException {
    // 不区分资源不存在与不属于当前游客，避免泄露测评资料是否存在。
    return new NotFoundException({ code: 'ASSESSMENT_NOT_FOUND', message: '测评不存在' });
  }
}
