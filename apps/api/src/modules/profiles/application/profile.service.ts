import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateProfileRequest,
  ProfileResponse,
  UpdateProfileRequest,
} from '@weekeasy/api-contracts';
import { PROFILE_REPOSITORY, type ProfileRepository } from './profile.repository.js';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly repository: ProfileRepository,
  ) {}

  create(guestSessionId: string, input: CreateProfileRequest): Promise<ProfileResponse> {
    return this.repository.create(
      guestSessionId,
      input,
      input.consentConfirmed ? new Date() : null,
    );
  }

  async get(guestSessionId: string, profileId: string): Promise<ProfileResponse> {
    const profile = await this.repository.findOwned(guestSessionId, profileId);
    if (!profile) {
      throw this.notFound();
    }
    return profile;
  }

  async update(
    guestSessionId: string,
    profileId: string,
    input: UpdateProfileRequest,
  ): Promise<ProfileResponse> {
    const consentConfirmedAt =
      input.consentConfirmed === undefined
        ? undefined
        : input.consentConfirmed
          ? new Date()
          : null;
    const profile = await this.repository.updateOwned(
      guestSessionId,
      profileId,
      input,
      consentConfirmedAt,
    );
    if (!profile) {
      throw this.notFound();
    }
    return profile;
  }

  private notFound(): NotFoundException {
    // 对不存在和不属于当前会话的档案统一返回 404，避免泄露资源存在性。
    return new NotFoundException({
      code: 'PROFILE_NOT_FOUND',
      message: '档案不存在',
    });
  }
}
