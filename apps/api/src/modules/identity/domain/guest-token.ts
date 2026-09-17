import { createHmac, randomBytes } from 'node:crypto';

export const GUEST_SESSION_COOKIE = 'weekeasy_guest';
export const GUEST_SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1_000;

export function createGuestToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashGuestToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(';')) {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex < 0 || entry.slice(0, separatorIndex).trim() !== name) {
      continue;
    }

    const value = entry.slice(separatorIndex + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return null;
}
