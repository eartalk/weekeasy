import type { BirthRecordResponse, CreateBirthRecordRequest } from '@weekeasy/api-contracts';
import type { CalculatedChartSnapshot } from '../../charts/application/chart.repository.js';

export const BIRTH_RECORD_REPOSITORY = Symbol('BIRTH_RECORD_REPOSITORY');

export interface BirthRecordRepository {
  createVersion(input: {
    guestSessionId: string;
    profileId: string;
    birthRecord: CreateBirthRecordRequest;
    inputHash: string;
    chart: CalculatedChartSnapshot;
  }): Promise<BirthRecordResponse | null>;
  findLatestOwned(
    guestSessionId: string,
    profileId: string,
  ): Promise<BirthRecordResponse | null>;
}
