import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';

@Injectable()
export class WorkerStatusService implements OnModuleInit {
  private readonly logger = new Logger(WorkerStatusService.name);

  onModuleInit() {
    this.logger.log('Processors are ready to be registered');
  }
}
