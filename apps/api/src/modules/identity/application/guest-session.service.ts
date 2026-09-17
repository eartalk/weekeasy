import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import {
  GUEST_SESSION_LIFETIME_MS,
  createGuestToken,
  hashGuestToken,
} from '../domain/guest-token.js';
import {
  GUEST_SESSION_REPOSITORY,
  type GuestSessionRepository,
} from './guest-session.repository.js';

const TOUCH_INTERVAL_MS = 60 * 60 * 1_000;

@Injectable()
export class GuestSessionService {
  private readonly hashSecret: string;

  constructor(
    @Inject(GUEST_SESSION_REPOSITORY)
    private readonly repository: GuestSessionRepository,
    @Inject(ConfigService) config: ConfigService<ServerEnvironment, true>,
  ) {
    this.hashSecret = config.get('DATA_HASH_SECRET', { infer: true });
  }

  async create(): Promise<{ token: string; expiresAt: Date }> {
    const token = createGuestToken();
    const expiresAt = new Date(Date.now() + GUEST_SESSION_LIFETIME_MS);
    await this.repository.create({
      tokenHash: hashGuestToken(token, this.hashSecret),
      expiresAt,
    });
    return { token, expiresAt };
  }

  async authenticate(token: string): Promise<string | null> {
    const now = new Date();
    const session = await this.repository.findActiveByTokenHash(
      hashGuestToken(token, this.hashSecret),
      now,
    );
    if (!session) {
      return null;
    }

    // 活跃时间按小时降频写入，避免每个请求都制造数据库写压力。
    if (now.getTime() - session.lastSeenAt.getTime() >= TOUCH_INTERVAL_MS) {
      await this.repository.touch(session.id, now);
    }
    return session.id;
  }
}
