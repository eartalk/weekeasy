import { createHmac } from 'node:crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BirthRecordResponse, CreateBirthRecordRequest } from '@weekeasy/api-contracts';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import { ChartService } from '../../charts/application/chart.service.js';
import {
  BIRTH_RECORD_REPOSITORY,
  type BirthRecordRepository,
} from './birth-record.repository.js';

@Injectable()
export class BirthRecordService {
  private readonly hashSecret: string;

  constructor(
    @Inject(BIRTH_RECORD_REPOSITORY)
    private readonly repository: BirthRecordRepository,
    @Inject(ChartService) private readonly charts: ChartService,
    @Inject(ConfigService) config: ConfigService<ServerEnvironment, true>,
  ) {
    this.hashSecret = config.get('DATA_HASH_SECRET', { infer: true });
  }

  async create(
    guestSessionId: string,
    profileId: string,
    input: CreateBirthRecordRequest,
  ): Promise<BirthRecordResponse> {
    const inputHash = this.hashInput(input);
    const chart = this.charts.prepare(input);
    const record = await this.repository.createVersion({
      guestSessionId,
      profileId,
      birthRecord: input,
      inputHash,
      chart,
    });
    if (!record) {
      throw this.notFound();
    }
    return record;
  }

  async latest(guestSessionId: string, profileId: string): Promise<BirthRecordResponse> {
    const record = await this.repository.findLatestOwned(guestSessionId, profileId);
    if (!record) {
      throw this.notFound();
    }
    return record;
  }

  private hashInput(input: CreateBirthRecordRequest): string {
    // 契约解析后的对象具有稳定字段顺序，HMAC 只用于判重且不可反推原始出生资料。
    return createHmac('sha256', this.hashSecret).update(JSON.stringify(input)).digest('hex');
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: 'BIRTH_RECORD_NOT_FOUND',
      message: '档案或出生记录不存在',
    });
  }
}
