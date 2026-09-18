import { chartResponseSchema } from '@weekeasy/api-contracts';
import type { ChartResponse } from '@weekeasy/api-contracts';
import { ApiRequestError } from '../../onboarding/api/onboarding-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface ApiErrorBody {
  readonly code?: string;
  readonly message?: string;
}

export async function getLatestChart(profileId: string): Promise<ChartResponse> {
  const response = await fetch(`${API_BASE_URL}/profiles/${profileId}/charts/latest`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      body.code ?? 'CHART_REQUEST_FAILED',
      body.message ?? '命盘读取失败，请稍后重试',
    );
  }
  return chartResponseSchema.parse(body);
}
