export const GUEST_SESSION_REPOSITORY = Symbol('GUEST_SESSION_REPOSITORY');

export interface GuestSessionRecord {
  readonly id: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly lastSeenAt: Date;
}

export interface GuestSessionRepository {
  create(input: { tokenHash: string; expiresAt: Date }): Promise<GuestSessionRecord>;
  findActiveByTokenHash(tokenHash: string, now: Date): Promise<GuestSessionRecord | null>;
  touch(id: string, now: Date): Promise<void>;
}
