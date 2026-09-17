import { describe, expect, it } from 'vitest';
import { createGuestToken, hashGuestToken, readCookie } from '../src/modules/identity/domain/guest-token.js';

describe('guest token', () => {
  it('creates a high-entropy token and stores only a keyed fingerprint', () => {
    const token = createGuestToken();
    const hash = hashGuestToken(token, 'a'.repeat(32));

    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(token);
  });

  it('reads only the requested cookie', () => {
    expect(readCookie('theme=dark; weekeasy_guest=token%2Evalue', 'weekeasy_guest')).toBe(
      'token.value',
    );
  });
});
