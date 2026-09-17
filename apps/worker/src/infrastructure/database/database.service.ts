import { Inject, Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import { createDatabaseClient } from '@weekeasy/database';
import type { DatabaseClient } from '@weekeasy/database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  readonly client: DatabaseClient;

  constructor(
    @Inject(ConfigService) config: ConfigService<ServerEnvironment, true>,
  ) {
    // Worker 使用独立连接池，不与 API 进程共享可变运行时状态。
    this.client = createDatabaseClient(config.get('DATABASE_URL', { infer: true }));
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
