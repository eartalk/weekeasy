import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateProfileRequest,
  ProfileResponse,
  UpdateProfileRequest,
} from '@weekeasy/api-contracts';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import type { ProfileRepository } from '../application/profile.repository.js';

const profileSelection = {
  id: true,
  displayName: true,
  relationship: true,
  gender: true,
  concernTopics: true,
  consentConfirmedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedProfile = {
  id: string;
  displayName: string;
  relationship: ProfileResponse['relationship'];
  gender: ProfileResponse['gender'];
  concernTopics: string[];
  consentConfirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toResponse(profile: SelectedProfile): ProfileResponse {
  return {
    ...profile,
    consentConfirmedAt: profile.consentConfirmedAt?.toISOString() ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaProfileRepository implements ProfileRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async create(
    guestSessionId: string,
    input: CreateProfileRequest,
    consentConfirmedAt: Date | null,
  ): Promise<ProfileResponse> {
    const profile = await this.database.client.profile.create({
      data: {
        anonymousId: guestSessionId,
        displayName: input.displayName,
        relationship: input.relationship,
        gender: input.gender,
        concernTopics: input.concernTopics,
        consentConfirmedAt,
      },
      select: profileSelection,
    });
    return toResponse(profile);
  }

  async findOwned(guestSessionId: string, profileId: string): Promise<ProfileResponse | null> {
    const profile = await this.database.client.profile.findFirst({
      where: { id: profileId, anonymousId: guestSessionId, deletedAt: null },
      select: profileSelection,
    });
    return profile ? toResponse(profile) : null;
  }

  async updateOwned(
    guestSessionId: string,
    profileId: string,
    input: UpdateProfileRequest,
    consentConfirmedAt: Date | null | undefined,
  ): Promise<ProfileResponse | null> {
    const result = await this.database.client.profile.updateMany({
      where: { id: profileId, anonymousId: guestSessionId, deletedAt: null },
      data: {
        displayName: input.displayName,
        relationship: input.relationship,
        gender: input.gender,
        concernTopics: input.concernTopics,
        consentConfirmedAt,
      },
    });
    return result.count === 0 ? null : this.findOwned(guestSessionId, profileId);
  }
}
