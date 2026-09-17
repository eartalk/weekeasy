import {
  birthRecordResponseSchema,
  guestSessionResponseSchema,
  profileResponseSchema,
} from '@weekeasy/api-contracts';
import type {
  BirthRecordResponse,
  CreateBirthRecordRequest,
  CreateProfileRequest,
  ProfileResponse,
} from '@weekeasy/api-contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
const GUEST_MARKER = 'weekeasy_guest_initialized';

interface ApiErrorBody {
  readonly code?: string;
  readonly message?: string;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      body.code ?? 'REQUEST_FAILED',
      body.message ?? '请求失败，请稍后重试',
    );
  }
  return body;
}

async function ensureGuestSession(): Promise<void> {
  if (sessionStorage.getItem(GUEST_MARKER) === 'true') {
    return;
  }
  const response = await request('/guest-sessions', { method: 'POST' });
  guestSessionResponseSchema.parse(response);
  sessionStorage.setItem(GUEST_MARKER, 'true');
}

export async function createGuestProfile(
  input: CreateProfileRequest,
): Promise<ProfileResponse> {
  await ensureGuestSession();
  try {
    return profileResponseSchema.parse(
      await request('/profiles', { method: 'POST', body: JSON.stringify(input) }),
    );
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401) {
      throw error;
    }
    // 浏览器标记可能比 HttpOnly Cookie 存活更久，401 时只重建一次游客会话。
    sessionStorage.removeItem(GUEST_MARKER);
    await ensureGuestSession();
    return profileResponseSchema.parse(
      await request('/profiles', { method: 'POST', body: JSON.stringify(input) }),
    );
  }
}

export async function createBirthRecord(
  profileId: string,
  input: CreateBirthRecordRequest,
): Promise<BirthRecordResponse> {
  return birthRecordResponseSchema.parse(
    await request(`/profiles/${profileId}/birth-records`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}
