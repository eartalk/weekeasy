import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import type {
  GuestSessionRecord,
  GuestSessionRepository,
} from '../application/guest-session.repository.js';

@Injectable()
export class PrismaGuestSessionRepository implements GuestSessionRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  create(input: { tokenHash: string; expiresAt: Date }): Promise<GuestSessionRecord> {
    return this.database.client.guestSession.create({ data: input });
  }

  findActiveByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<GuestSessionRecord | null> {
    return this.database.client.guestSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true, expiresAt: true, revokedAt: true, lastSeenAt: true },
    });
  }

  async touch(id: string, now: Date): Promise<void> {
    await this.database.client.guestSession.updateMany({
      where: { id, revokedAt: null, expiresAt: { gt: now } },
      data: { lastSeenAt: now },
    });
  }
}
