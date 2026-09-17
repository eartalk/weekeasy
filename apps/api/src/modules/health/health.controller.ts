import { Controller, Get, Inject } from '@nestjs/common';
import type { HealthResponse } from '@weekeasy/api-contracts';
import { RedisService } from '../../infrastructure/cache/redis.service.js';
import { DatabaseService } from '../../infrastructure/database/database.service.js';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  @Get()
  check(): HealthResponse {
    return {
      service: 'api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async readiness(): Promise<HealthResponse> {
    // Readiness 会真实访问外部依赖，供部署系统判断是否可以接收流量。
    await Promise.all([this.database.ping(), this.redis.ping()]);
    return {
      service: 'api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
