import type { BirthRecordResponse, CreateBirthRecordRequest } from '@weekeasy/api-contracts';

export const BIRTH_RECORD_REPOSITORY = Symbol('BIRTH_RECORD_REPOSITORY');

export interface BirthRecordRepository {
  createVersion(input: {
    guestSessionId: string;
    profileId: string;
    birthRecord: CreateBirthRecordRequest;
    inputHash: string;
  }): Promise<BirthRecordResponse | null>;
  findLatestOwned(
    guestSessionId: string,
    profileId: string,
  ): Promise<BirthRecordResponse | null>;
}
