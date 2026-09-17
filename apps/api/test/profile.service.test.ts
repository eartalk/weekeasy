import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { ProfileResponse } from '@weekeasy/api-contracts';
import type { ProfileRepository } from '../src/modules/profiles/application/profile.repository.js';
import { ProfileService } from '../src/modules/profiles/application/profile.service.js';

const profile: ProfileResponse = {
  id: '01993f2e-8100-7000-8000-000000000001',
  displayName: '我',
  relationship: 'SELF',
  gender: 'UNSPECIFIED',
  concernTopics: [],
  consentConfirmedAt: null,
  createdAt: '2026-09-17T00:00:00.000Z',
  updatedAt: '2026-09-17T00:00:00.000Z',
};

function createRepository(): ProfileRepository {
  return {
    create: vi.fn(async () => profile),
    findOwned: vi.fn(async () => null),
    updateOwned: vi.fn(async () => null),
  };
}

describe('ProfileService', () => {
  it('associates a new profile with the authenticated guest session', async () => {
    const repository = createRepository();
    const service = new ProfileService(repository);

    await expect(
      service.create('guest-session-id', {
        displayName: '我',
        relationship: 'SELF',
        gender: 'UNSPECIFIED',
        concernTopics: [],
        consentConfirmed: false,
      }),
    ).resolves.toEqual(profile);
    expect(repository.create).toHaveBeenCalledWith(
      'guest-session-id',
      expect.objectContaining({ displayName: '我' }),
      null,
    );
  });

  it('does not reveal whether an inaccessible profile exists', async () => {
    const service = new ProfileService(createRepository());

    await expect(service.get('another-session', profile.id)).rejects.toMatchObject({
      constructor: NotFoundException,
      response: {
        code: 'PROFILE_NOT_FOUND',
        message: '档案不存在',
      },
    });
  });
});
