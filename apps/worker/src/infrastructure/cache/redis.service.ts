import { Inject, Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client: Redis;

  constructor(
    @Inject(ConfigService) config: ConfigService<ServerEnvironment, true>,
  ) {
    // Worker 启动时才建立 Redis 连接，确保配置已完成校验。
    this.client = new Redis(config.get('REDIS_URL', { infer: true }), {
      enableReadyCheck: true,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async onModuleInit() {
    await this.client.connect();
    const result = await this.client.ping();
    if (result !== 'PONG') {
      throw new Error('Redis 健康检查未返回 PONG');
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
