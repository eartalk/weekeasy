import {
  assessmentAttemptResponseSchema,
  assessmentResultResponseSchema,
} from '@weekeasy/api-contracts';
import type {
  AssessmentAnswer,
  AssessmentAttemptResponse,
  AssessmentResultResponse,
} from '@weekeasy/api-contracts';
import { ApiRequestError } from '../../onboarding/api/onboarding-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface ApiErrorBody {
  readonly code?: string;
  readonly message?: string;
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      body.code ?? 'ASSESSMENT_REQUEST_FAILED',
      body.message ?? '测评请求失败，请稍后重试',
    );
  }
  return body;
}

export async function startAssessment(profileId: string): Promise<AssessmentAttemptResponse> {
  return assessmentAttemptResponseSchema.parse(await request(`/profiles/${profileId}/assessment-attempts`, {
    method: 'POST',
  }));
}

export async function saveAssessmentAnswers(
  profileId: string,
  attemptId: string,
  answers: readonly AssessmentAnswer[],
): Promise<AssessmentAttemptResponse> {
  return assessmentAttemptResponseSchema.parse(await request(
    `/profiles/${profileId}/assessment-attempts/${attemptId}/answers`,
    { method: 'PUT', body: JSON.stringify({ answers }) },
  ));
}

export async function completeAssessment(
  profileId: string,
  attemptId: string,
  answers: readonly AssessmentAnswer[],
): Promise<AssessmentResultResponse> {
  return assessmentResultResponseSchema.parse(await request(
    `/profiles/${profileId}/assessment-attempts/${attemptId}/complete`,
    { method: 'POST', body: JSON.stringify({ answers }) },
  ));
}

export async function getLatestAssessmentResult(profileId: string): Promise<AssessmentResultResponse> {
  return assessmentResultResponseSchema.parse(await request(`/profiles/${profileId}/assessment-attempts/latest`));
}
