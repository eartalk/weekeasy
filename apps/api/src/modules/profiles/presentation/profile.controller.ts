import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  createBirthRecordRequestSchema,
  createProfileRequestSchema,
  updateProfileRequestSchema,
} from '@weekeasy/api-contracts';
import type {
  BirthRecordResponse,
  CreateBirthRecordRequest,
  CreateProfileRequest,
  ProfileResponse,
  UpdateProfileRequest,
} from '@weekeasy/api-contracts';
import { ZodValidationPipe } from '../../../common/validation/zod-validation.pipe.js';
import { GuestSessionGuard } from '../../identity/presentation/guest-session.guard.js';
import type { GuestAuthenticatedRequest } from '../../identity/presentation/guest-session.guard.js';
import { BirthRecordService } from '../application/birth-record.service.js';
import { ProfileService } from '../application/profile.service.js';

@Controller({ path: 'profiles', version: '1' })
@UseGuards(GuestSessionGuard)
export class ProfileController {
  constructor(
    @Inject(ProfileService) private readonly profiles: ProfileService,
    @Inject(BirthRecordService) private readonly birthRecords: BirthRecordService,
  ) {}

  @Post()
  create(
    @Req() request: GuestAuthenticatedRequest,
    @Body(new ZodValidationPipe(createProfileRequestSchema)) input: CreateProfileRequest,
  ): Promise<ProfileResponse> {
    return this.profiles.create(this.sessionId(request), input);
  }

  @Get(':profileId')
  get(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
  ): Promise<ProfileResponse> {
    return this.profiles.get(this.sessionId(request), profileId);
  }

  @Patch(':profileId')
  update(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
    @Body(new ZodValidationPipe(updateProfileRequestSchema)) input: UpdateProfileRequest,
  ): Promise<ProfileResponse> {
    return this.profiles.update(this.sessionId(request), profileId, input);
  }

  @Post(':profileId/birth-records')
  createBirthRecord(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
    @Body(new ZodValidationPipe(createBirthRecordRequestSchema))
    input: CreateBirthRecordRequest,
  ): Promise<BirthRecordResponse> {
    return this.birthRecords.create(this.sessionId(request), profileId, input);
  }

  @Get(':profileId/birth-records/latest')
  latestBirthRecord(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
  ): Promise<BirthRecordResponse> {
    return this.birthRecords.latest(this.sessionId(request), profileId);
  }

  private sessionId(request: GuestAuthenticatedRequest): string {
    if (!request.guestSessionId) {
      throw new Error('游客会话守卫未注入会话标识');
    }
    return request.guestSessionId;
  }
}
