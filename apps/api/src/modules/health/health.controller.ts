import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@weekeasy/api-contracts';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      service: 'api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
