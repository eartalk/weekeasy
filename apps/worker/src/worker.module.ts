import { Module } from '@nestjs/common';
import { WorkerStatusService } from './services/worker-status.service.js';

@Module({ providers: [WorkerStatusService] })
export class WorkerModule {}
