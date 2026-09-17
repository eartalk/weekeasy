import type {
  CreateProfileRequest,
  ProfileResponse,
  UpdateProfileRequest,
} from '@weekeasy/api-contracts';

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');

export interface ProfileRepository {
  create(
    guestSessionId: string,
    input: CreateProfileRequest,
    consentConfirmedAt: Date | null,
  ): Promise<ProfileResponse>;
  findOwned(guestSessionId: string, profileId: string): Promise<ProfileResponse | null>;
  updateOwned(
    guestSessionId: string,
    profileId: string,
    input: UpdateProfileRequest,
    consentConfirmedAt: Date | null | undefined,
  ): Promise<ProfileResponse | null>;
}
