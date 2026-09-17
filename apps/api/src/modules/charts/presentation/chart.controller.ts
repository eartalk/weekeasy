import { Controller, Get, Inject, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import type { ChartResponse } from '@weekeasy/api-contracts';
import { GuestSessionGuard } from '../../identity/presentation/guest-session.guard.js';
import type { GuestAuthenticatedRequest } from '../../identity/presentation/guest-session.guard.js';
import { ChartService } from '../application/chart.service.js';

@Controller({ path: 'profiles', version: '1' })
@UseGuards(GuestSessionGuard)
export class ChartController {
  constructor(@Inject(ChartService) private readonly charts: ChartService) {}

  @Get(':profileId/charts/latest')
  latest(
    @Req() request: GuestAuthenticatedRequest,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
  ): Promise<ChartResponse> {
    return this.charts.latest(this.sessionId(request), profileId);
  }

  private sessionId(request: GuestAuthenticatedRequest): string {
    if (!request.guestSessionId) {
      throw new Error('游客会话守卫未注入会话标识');
    }
    return request.guestSessionId;
  }
}
