import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { saveAssessmentAnswersRequestSchema } from '@weekeasy/api-contracts';
import type {
  AssessmentAttemptResponse,
  AssessmentDefinitionResponse,
  AssessmentResultResponse,
  SaveAssessmentAnswersRequest,
} from '@weekeasy/api-contracts';
import { ZodValidationPipe } from '../../../common/validation/zod-validation.pipe.js';
import { GuestSessionGuard } from '../../identity/presentation/guest-session.guard.js';
import type { GuestAuthenticatedRequest } from '../../identity/presentation/guest-session.guard.js';
import { AssessmentService } from '../application/assessment.service.js';

@Controller({ path: 'assessments', version: '1' })
@UseGuards(GuestSessionGuard)
export class AssessmentDefinitionController {
  constructor(@Inject(AssessmentService) private readonly assessments: AssessmentService) {}

  @Get('current')
  current(): Promise<AssessmentDefinitionResponse> {
    return this.assessments.currentDefinition();
  }
}

@Controller({ path: 'profiles', version: '1' })
@UseGuards(GuestSessionGuard)
export class AssessmentAttemptController {
  constructor(@Inject(AssessmentService) private readonly assessments: AssessmentService) {}

  @Post(':profileId/assessment-attempts')
  start(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
  ): Promise<AssessmentAttemptResponse> {
    return this.assessments.start(this.sessionId(request), profileId);
  }

  @Put(':profileId/assessment-attempts/:attemptId/answers')
  save(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
    @Param('attemptId', new ParseUUIDPipe()) attemptId: string,
    @Body(new ZodValidationPipe(saveAssessmentAnswersRequestSchema)) input: SaveAssessmentAnswersRequest,
  ): Promise<AssessmentAttemptResponse> {
    return this.assessments.save(this.sessionId(request), profileId, attemptId, input);
  }

  @Post(':profileId/assessment-attempts/:attemptId/complete')
  complete(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
    @Param('attemptId', new ParseUUIDPipe()) attemptId: string,
    @Body(new ZodValidationPipe(saveAssessmentAnswersRequestSchema)) input: SaveAssessmentAnswersRequest,
  ): Promise<AssessmentResultResponse> {
    return this.assessments.complete(this.sessionId(request), profileId, attemptId, input);
  }

  @Get(':profileId/assessment-attempts/latest')
  latest(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
  ): Promise<AssessmentResultResponse> {
    return this.assessments.latest(this.sessionId(request), profileId);
  }

  private sessionId(request: GuestAuthenticatedRequest): string {
    if (!request.guestSessionId) throw new Error('游客会话守卫未注入会话标识');
    return request.guestSessionId;
  }
}
