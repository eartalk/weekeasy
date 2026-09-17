import { Module } from '@nestjs/common';
import { ChartsModule } from '../charts/charts.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { BIRTH_RECORD_REPOSITORY } from './application/birth-record.repository.js';
import { BirthRecordService } from './application/birth-record.service.js';
import { PROFILE_REPOSITORY } from './application/profile.repository.js';
import { ProfileService } from './application/profile.service.js';
import { PrismaBirthRecordRepository } from './infrastructure/prisma-birth-record.repository.js';
import { PrismaProfileRepository } from './infrastructure/prisma-profile.repository.js';
import { ProfileController } from './presentation/profile.controller.js';

@Module({
  imports: [IdentityModule, ChartsModule],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    BirthRecordService,
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
    { provide: BIRTH_RECORD_REPOSITORY, useClass: PrismaBirthRecordRepository },
  ],
})
export class ProfilesModule {}
