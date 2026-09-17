import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from '@weekeasy/api-contracts';

describe('health contract', () => {
  it('accepts a valid health payload', () => {
    expect(
      healthResponseSchema.parse({
        service: 'api',
        status: 'ok',
        timestamp: new Date().toISOString(),
      }),
    ).toBeDefined();
  });
});
