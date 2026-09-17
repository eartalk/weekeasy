import { Controller, HttpCode, HttpStatus, Inject, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GuestSessionResponse } from '@weekeasy/api-contracts';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import { GuestSessionService } from '../application/guest-session.service.js';
import {
  GUEST_SESSION_COOKIE,
  GUEST_SESSION_LIFETIME_MS,
} from '../domain/guest-token.js';

interface CookieResponse {
  cookie(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: 'lax';
      secure: boolean;
      path: string;
      maxAge: number;
    },
  ): void;
}

@Controller({ path: 'guest-sessions', version: '1' })
export class GuestSessionController {
  constructor(
    @Inject(GuestSessionService)
    private readonly guestSessions: GuestSessionService,
    @Inject(ConfigService)
    private readonly config: ConfigService<ServerEnvironment, true>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Res({ passthrough: true }) response: CookieResponse): Promise<GuestSessionResponse> {
    const session = await this.guestSessions.create();
    response.cookie(GUEST_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      path: '/',
      maxAge: GUEST_SESSION_LIFETIME_MS,
    });
    return { expiresAt: session.expiresAt.toISOString() };
  }
}
