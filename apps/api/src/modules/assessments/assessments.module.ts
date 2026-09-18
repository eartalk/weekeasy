import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module.js';
import { ASSESSMENT_REPOSITORY } from './application/assessment.repository.js';
import { AssessmentService } from './application/assessment.service.js';
import { PrismaAssessmentRepository } from './infrastructure/prisma-assessment.repository.js';
import { AssessmentAttemptController, AssessmentDefinitionController } from './presentation/assessment.controller.js';

@Module({
  imports: [IdentityModule],
  controllers: [AssessmentDefinitionController, AssessmentAttemptController],
  providers: [
    AssessmentService,
    { provide: ASSESSMENT_REPOSITORY, useClass: PrismaAssessmentRepository },
  ],
})
export class AssessmentsModule {}
