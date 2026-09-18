import { createHmac } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BirthRecordResponse, CreateBirthRecordRequest } from '@weekeasy/api-contracts';
import type { Prisma } from '@weekeasy/database';
import { DatabaseService } from '../../../infrastructure/database/database.service.js';
import type { ServerEnvironment } from '@weekeasy/config/environment';
import type { CalculatedChartSnapshot } from '../../charts/application/chart.repository.js';
import type { BirthRecordRepository } from '../application/birth-record.repository.js';

const birthRecordSelection = {
  id: true,
  profileId: true,
  revision: true,
  calendarType: true,
  isLeapMonth: true,
  precision: true,
  localDate: true,
  localTime: true,
  timezoneId: true,
  utcOffsetMinutes: true,
  countryCode: true,
  regionName: true,
  cityName: true,
  latitude: true,
  longitude: true,
  useTrueSolarTime: true,
  adjustedLocalDatetime: true,
  dayBoundaryRule: true,
  createdAt: true,
  supersededAt: true,
} as const;

interface DecimalLike {
  toString(): string;
}

type SelectedBirthRecord = {
  id: string;
  profileId: string;
  revision: number;
  calendarType: BirthRecordResponse['calendarType'];
  isLeapMonth: boolean;
  precision: BirthRecordResponse['precision'];
  localDate: string;
  localTime: Date | null;
  timezoneId: string;
  utcOffsetMinutes: number;
  countryCode: string | null;
  regionName: string | null;
  cityName: string | null;
  latitude: DecimalLike | null;
  longitude: DecimalLike | null;
  useTrueSolarTime: boolean;
  adjustedLocalDatetime: Date | null;
  dayBoundaryRule: BirthRecordResponse['dayBoundaryRule'];
  createdAt: Date;
  supersededAt: Date | null;
};

function toResponse(record: SelectedBirthRecord): BirthRecordResponse {
  return {
    id: record.id,
    profileId: record.profileId,
    revision: record.revision,
    calendarType: record.calendarType,
    isLeapMonth: record.isLeapMonth,
    precision: record.precision,
    localDate: record.localDate,
    localTime: record.localTime?.toISOString().slice(11, 16) ?? null,
    timezoneId: record.timezoneId,
    utcOffsetMinutes: record.utcOffsetMinutes,
    countryCode: record.countryCode,
    regionName: record.regionName,
    cityName: record.cityName,
    latitude: record.latitude === null ? null : Number(record.latitude.toString()),
    longitude: record.longitude === null ? null : Number(record.longitude.toString()),
    useTrueSolarTime: record.useTrueSolarTime,
    adjustedLocalDatetime: record.adjustedLocalDatetime?.toISOString().slice(0, 19) ?? null,
    dayBoundaryRule: record.dayBoundaryRule,
    createdAt: record.createdAt.toISOString(),
    supersededAt: record.supersededAt?.toISOString() ?? null,
  };
}

function isRetryableTransactionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  return error.code === 'P2034' || error.code === 'P2002';
}

@Injectable()
export class PrismaBirthRecordRepository implements BirthRecordRepository {
  private readonly hashSecret: string;

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(ConfigService) config: ConfigService<ServerEnvironment, true>,
  ) {
    this.hashSecret = config.get('DATA_HASH_SECRET', { infer: true });
  }

  async createVersion(input: {
    guestSessionId: string;
    profileId: string;
    birthRecord: CreateBirthRecordRequest;
    inputHash: string;
    chart: CalculatedChartSnapshot;
  }): Promise<BirthRecordResponse | null> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const record = await this.createVersionInTransaction(input);
        return record ? toResponse(record) : null;
      } catch (error) {
        if (attempt === 3 || !isRetryableTransactionError(error)) {
          throw error;
        }
      }
    }
    return null;
  }

  async findLatestOwned(
    guestSessionId: string,
    profileId: string,
  ): Promise<BirthRecordResponse | null> {
    const record = await this.database.client.birthRecord.findFirst({
      where: {
        profileId,
        profile: { anonymousId: guestSessionId, deletedAt: null },
      },
      orderBy: { revision: 'desc' },
      select: birthRecordSelection,
    });
    return record ? toResponse(record) : null;
  }

  private createVersionInTransaction(input: {
    guestSessionId: string;
    profileId: string;
    birthRecord: CreateBirthRecordRequest;
    inputHash: string;
    chart: CalculatedChartSnapshot;
  }): Promise<SelectedBirthRecord | null> {
    return this.database.client.$transaction(
      async (transaction) => {
        const profile = await transaction.profile.findFirst({
          where: {
            id: input.profileId,
            anonymousId: input.guestSessionId,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (!profile) {
          return null;
        }

        const previous = await transaction.birthRecord.findFirst({
          where: { profileId: input.profileId },
          orderBy: { revision: 'desc' },
          select: { id: true, revision: true },
        });
        const now = new Date();
        if (previous) {
          await transaction.birthRecord.update({
            where: { id: previous.id },
            data: { supersededAt: now },
          });
        }

        const birthRecord = input.birthRecord;
        const created = await transaction.birthRecord.create({
          data: {
            profileId: input.profileId,
            revision: (previous?.revision ?? 0) + 1,
            calendarType: birthRecord.calendarType,
            isLeapMonth: birthRecord.isLeapMonth,
            precision: birthRecord.precision,
            localDate: birthRecord.localDate,
            localTime:
              birthRecord.localTime === null
                ? null
                : new Date(`1970-01-01T${birthRecord.localTime}:00.000Z`),
            timezoneId: birthRecord.timezoneId,
            utcOffsetMinutes: input.chart.utcOffsetMinutes,
            countryCode: birthRecord.countryCode,
            regionName: birthRecord.regionName,
            cityName: birthRecord.cityName,
            latitude: birthRecord.latitude,
            longitude: birthRecord.longitude,
            useTrueSolarTime: birthRecord.useTrueSolarTime,
            adjustedLocalDatetime: input.chart.adjustedLocalDatetime === null
              ? null
              : new Date(`${input.chart.adjustedLocalDatetime}.000Z`),
            dayBoundaryRule: birthRecord.dayBoundaryRule,
            inputHash: input.inputHash,
          },
          select: birthRecordSelection,
        });

        const chart = input.chart;
        const calculationHash = createHmac('sha256', this.hashSecret)
          .update(JSON.stringify({
            birthRecordId: created.id,
            inputHash: input.inputHash,
            engineVersion: chart.engineVersion,
            calendarAdapterVersion: chart.calendarAdapterVersion,
            calculationPolicyVersion: chart.calculationPolicyVersion,
          }))
          .digest('hex');
        await transaction.natalChart.create({
          data: {
            profileId: input.profileId,
            birthRecordId: created.id,
            engineVersion: chart.engineVersion,
            calendarAdapter: chart.calendarAdapter,
            calendarAdapterVersion: chart.calendarAdapterVersion,
            calculationPolicyVersion: chart.calculationPolicyVersion,
            yearPillar: chart.yearPillar,
            monthPillar: chart.monthPillar,
            dayPillar: chart.dayPillar,
            hourPillar: chart.hourPillar,
            chartData: chart.chartData as Prisma.InputJsonValue,
            warnings: [...chart.warnings] as Prisma.InputJsonValue,
            calculationHash,
          },
        });
        return created;
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
