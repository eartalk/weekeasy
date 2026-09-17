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
    // Redis 连接延迟到 Nest 生命周期启动，避免模块加载阶段产生外部连接。
    this.client = new Redis(config.get('REDIS_URL', { infer: true }), {
      enableReadyCheck: true,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async onModuleInit() {
    await this.client.connect();
    await this.ping();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async ping(): Promise<void> {
    const result = await this.client.ping();
    if (result !== 'PONG') {
      throw new Error('Redis 健康检查未返回 PONG');
    }
  }
}
