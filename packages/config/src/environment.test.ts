import { describe, expect, it } from 'vitest';
import { validateServerEnvironment } from './environment.js';

const validEnvironment = {
  NODE_ENV: 'test',
  API_PORT: '3001',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'weekeasy',
  DB_SCHEMA: 'public',
  DB_USER: 'weekeasy',
  DB_PASSWORD: 'database-password',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_USERNAME: 'default',
  REDIS_PASSWORD: 'redis-password',
  MAIL_FROM: 'noreply@weekeasy.local',
  SESSION_SECRET: 'session-secret-with-at-least-32-characters',
  DATA_HASH_SECRET: 'data-hash-secret-with-at-least-32-characters',
};

describe('validateServerEnvironment', () => {
  it('coerces ports and applies local mail defaults', () => {
    const environment = validateServerEnvironment(validEnvironment);

    expect(environment.API_PORT).toBe(3001);
    expect(environment.MAILPIT_SMTP_PORT).toBe(1025);
    expect(environment.DATABASE_URL).toBe(
      'postgresql://weekeasy:database-password@localhost:5432/weekeasy?schema=public',
    );
    expect(environment.REDIS_URL).toBe(
      'redis://default:redis-password@localhost:6379',
    );
  });

  it('rejects reused security secrets', () => {
    expect(() =>
      validateServerEnvironment({
        ...validEnvironment,
        DATA_HASH_SECRET: validEnvironment.SESSION_SECRET,
      }),
    ).toThrow('必须使用不同密钥');
  });
});
