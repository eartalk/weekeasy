import { Module } from '@nestjs/common';
import { GUEST_SESSION_REPOSITORY } from './application/guest-session.repository.js';
import { GuestSessionService } from './application/guest-session.service.js';
import { PrismaGuestSessionRepository } from './infrastructure/prisma-guest-session.repository.js';
import { GuestSessionController } from './presentation/guest-session.controller.js';
import { GuestSessionGuard } from './presentation/guest-session.guard.js';

@Module({
  controllers: [GuestSessionController],
  providers: [
    GuestSessionService,
    GuestSessionGuard,
    {
      provide: GUEST_SESSION_REPOSITORY,
      useClass: PrismaGuestSessionRepository,
    },
  ],
  exports: [GuestSessionService, GuestSessionGuard],
})
export class IdentityModule {}
