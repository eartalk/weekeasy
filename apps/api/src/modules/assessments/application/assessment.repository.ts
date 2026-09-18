import type {
  AssessmentAnswer,
  AssessmentAttemptResponse,
  AssessmentDefinitionResponse,
  AssessmentResultResponse,
} from '@weekeasy/api-contracts';
import type { BigFiveAssessmentDefinition, BigFiveAssessmentResult } from '@weekeasy/assessment-core';

export const ASSESSMENT_REPOSITORY = Symbol('ASSESSMENT_REPOSITORY');

export interface AssessmentDefinitionSnapshot {
  readonly response: AssessmentDefinitionResponse;
  readonly scoringDefinition: BigFiveAssessmentDefinition;
  readonly questionCodesById: ReadonlyMap<string, string>;
}

export interface AssessmentAttemptForScoring {
  readonly attempt: AssessmentAttemptResponse;
  readonly definition: AssessmentDefinitionSnapshot;
}

export interface AssessmentRepository {
  findCurrentDefinition(): Promise<AssessmentDefinitionSnapshot | null>;
  startOrResumeOwned(
    guestSessionId: string,
    profileId: string,
    definitionId: string,
  ): Promise<AssessmentAttemptResponse | null>;
  saveAnswersOwned(
    guestSessionId: string,
    profileId: string,
    attemptId: string,
    answers: readonly AssessmentAnswer[],
  ): Promise<AssessmentAttemptResponse | null>;
  findForScoringOwned(
    guestSessionId: string,
    profileId: string,
    attemptId: string,
  ): Promise<AssessmentAttemptForScoring | null>;
  completeOwned(
    guestSessionId: string,
    profileId: string,
    attemptId: string,
    answers: readonly AssessmentAnswer[],
    result: BigFiveAssessmentResult,
    completedAt: Date,
  ): Promise<AssessmentResultResponse | null>;
  findLatestResultOwned(
    guestSessionId: string,
    profileId: string,
  ): Promise<AssessmentResultResponse | null>;
}
