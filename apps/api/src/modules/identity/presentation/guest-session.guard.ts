import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { GUEST_SESSION_COOKIE, readCookie } from '../domain/guest-token.js';
import { GuestSessionService } from '../application/guest-session.service.js';

export interface GuestAuthenticatedRequest {
  readonly headers: { readonly cookie?: string };
  guestSessionId?: string;
}

@Injectable()
export class GuestSessionGuard implements CanActivate {
  constructor(
    @Inject(GuestSessionService)
    private readonly guestSessions: GuestSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GuestAuthenticatedRequest>();
    const token = readCookie(request.headers.cookie, GUEST_SESSION_COOKIE);
    const sessionId = token ? await this.guestSessions.authenticate(token) : null;
    if (!sessionId) {
      throw new UnauthorizedException({
        code: 'GUEST_SESSION_REQUIRED',
        message: '请先创建有效的游客会话',
      });
    }

    request.guestSessionId = sessionId;
    return true;
  }
}
