import { z } from 'zod';

export const healthResponseSchema = z.object({
  service: z.string(),
  status: z.literal('ok'),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const profileRelationshipSchema = z.enum([
  'SELF',
  'PARTNER',
  'FAMILY',
  'FRIEND',
  'OTHER',
]);

export const profileGenderSchema = z.enum(['MALE', 'FEMALE', 'UNSPECIFIED']);

const concernTopicsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(10)
  .refine((topics) => new Set(topics).size === topics.length, {
    message: '关注主题不能重复',
  });

export const createProfileRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(50),
  relationship: profileRelationshipSchema.default('SELF'),
  gender: profileGenderSchema.default('UNSPECIFIED'),
  concernTopics: concernTopicsSchema.default([]),
  consentConfirmed: z.boolean().default(false),
});

export const updateProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(50).optional(),
    relationship: profileRelationshipSchema.optional(),
    gender: profileGenderSchema.optional(),
    concernTopics: concernTopicsSchema.optional(),
    consentConfirmed: z.boolean().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: '至少需要提交一个可修改字段',
  });

export const profileResponseSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  relationship: profileRelationshipSchema,
  gender: profileGenderSchema,
  concernTopics: z.array(z.string()),
  consentConfirmedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CreateProfileRequest = z.infer<typeof createProfileRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;

export const guestSessionResponseSchema = z.object({
  expiresAt: z.iso.datetime(),
});

export type GuestSessionResponse = z.infer<typeof guestSessionResponseSchema>;

export const calendarTypeSchema = z.enum(['SOLAR', 'LUNAR']);
export const birthTimePrecisionSchema = z.enum(['MINUTE', 'HOUR', 'UNKNOWN_HOUR']);
export const dayBoundaryRuleSchema = z.enum(['MIDNIGHT', 'LATE_ZI_HOUR']);

const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD');
const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

function isValidSolarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
}

function isValidLunarDateShape(value: string): boolean {
  const [, month, day] = value.split('-').map(Number);
  return month !== undefined && day !== undefined && month >= 1 && month <= 12 && day >= 1 && day <= 30;
}

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('zh-CN', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const createBirthRecordRequestSchema = z
  .object({
    calendarType: calendarTypeSchema,
    isLeapMonth: z.boolean().default(false),
    precision: birthTimePrecisionSchema,
    localDate: localDateSchema,
    localTime: localTimeSchema.nullable(),
    timezoneId: z.string().trim().min(1).max(100).refine(isIanaTimezone, {
      message: '时区必须是有效的 IANA 时区标识',
    }),
    countryCode: z.string().trim().length(2).toUpperCase().nullable().default(null),
    regionName: z.string().trim().min(1).max(100).nullable().default(null),
    cityName: z.string().trim().min(1).max(100).nullable().default(null),
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
    useTrueSolarTime: z.boolean().default(false),
    dayBoundaryRule: dayBoundaryRuleSchema.default('MIDNIGHT'),
  })
  .superRefine((input, context) => {
    const validDate = input.calendarType === 'SOLAR'
      ? isValidSolarDate(input.localDate)
      : isValidLunarDateShape(input.localDate);
    if (!validDate) {
      context.addIssue({ code: 'custom', message: '日期不合法', path: ['localDate'] });
    }
    if (input.calendarType === 'SOLAR' && input.isLeapMonth) {
      context.addIssue({ code: 'custom', message: '公历不能标记为闰月', path: ['isLeapMonth'] });
    }
    if (input.precision === 'UNKNOWN_HOUR' && input.localTime !== null) {
      context.addIssue({
        code: 'custom',
        message: '未知时辰时不能提交本地时间',
        path: ['localTime'],
      });
    }
    if (input.precision !== 'UNKNOWN_HOUR' && input.localTime === null) {
      context.addIssue({
        code: 'custom',
        message: '已知时辰时必须提交本地时间',
        path: ['localTime'],
      });
    }
    if (input.precision === 'HOUR' && input.localTime?.slice(3) !== '00') {
      context.addIssue({
        code: 'custom',
        message: '仅精确到小时时，分钟必须为 00',
        path: ['localTime'],
      });
    }
    if ((input.latitude === null) !== (input.longitude === null)) {
      context.addIssue({
        code: 'custom',
        message: '经纬度必须同时提交',
        path: ['latitude'],
      });
    }
    if (input.useTrueSolarTime && input.longitude === null) {
      context.addIssue({
        code: 'custom',
        message: '启用真太阳时时必须提交经纬度',
        path: ['useTrueSolarTime'],
      });
    }
  });

export const birthRecordResponseSchema = createBirthRecordRequestSchema.extend({
  id: z.uuid(),
  profileId: z.uuid(),
  revision: z.number().int().positive(),
  utcOffsetMinutes: z.number().int().min(-840).max(840),
  // 真太阳时修正后的当地墙上时间，不附加虚假的 UTC 标记。
  adjustedLocalDatetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).nullable(),
  createdAt: z.iso.datetime(),
  supersededAt: z.iso.datetime().nullable(),
});

export type CreateBirthRecordRequest = z.infer<typeof createBirthRecordRequestSchema>;
export type BirthRecordResponse = z.infer<typeof birthRecordResponseSchema>;

export const chartStatusSchema = z.enum(['CALCULATED', 'FAILED']);

// 藏干条目：地支所藏天干及其五行、十神。
const hiddenStemSchema = z.object({
  stem: z.string(),
  element: z.string(),
  tenGod: z.string(),
});

// 完整柱信息：干支、五行、阴阳、藏干与十神。
const pillarDetailSchema = z.object({
  stem: z.string(),
  branch: z.string(),
  stemElement: z.string(),
  branchElement: z.string(),
  stemYinYang: z.string(),
  branchYinYang: z.string(),
  hiddenStems: z.array(hiddenStemSchema),
  stemTenGod: z.string().nullable(),
});

const chartDataSchema = z.object({
  year: pillarDetailSchema,
  month: pillarDetailSchema,
  day: pillarDetailSchema,
  hour: pillarDetailSchema.nullable(),
  relations: z.array(
    z.object({
      kind: z.string(),
      positions: z.array(z.string()),
    }),
  ),
});

export const chartResponseSchema = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  birthRecordId: z.uuid(),
  engineVersion: z.string(),
  calendarAdapter: z.string(),
  calendarAdapterVersion: z.string(),
  calculationPolicyVersion: z.string(),
  status: chartStatusSchema,
  yearPillar: z.string().nullable(),
  monthPillar: z.string().nullable(),
  dayPillar: z.string().nullable(),
  hourPillar: z.string().nullable(),
  chartData: chartDataSchema,
  warnings: z.array(z.string()),
  calculatedAt: z.iso.datetime(),
});

export type ChartResponse = z.infer<typeof chartResponseSchema>;
