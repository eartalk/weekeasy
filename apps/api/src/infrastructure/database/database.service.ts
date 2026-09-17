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
    // 每个长运行进程只创建一个 Prisma Client，防止连接池数量失控。
    this.client = createDatabaseClient(config.get('DATABASE_URL', { infer: true }));
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  async ping(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }
}
