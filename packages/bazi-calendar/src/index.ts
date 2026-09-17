export { assertIanaTimeZone, toUtcInstant, type LocalDateTime } from './time-zone.js';
export {
  equationOfTimeMinutes,
  trueSolarTimeOffsetMinutes,
  type TrueSolarTimeOptions,
} from './true-solar-time.js';
export {
  resolveBirthInstant,
  type BirthInstantInput,
  type ResolvedBirthInstant,
  type CalendarType,
} from './birth-instant.js';
export {
  computeFourPillarIndices,
  type FourPillarIndices,
  type PillarIndices,
  type DayBoundaryRule,
} from './four-pillars.js';

// 历法适配器版本，用于命盘快照记录。
export const CALENDAR_ADAPTER = 'lunar-typescript';
export const CALENDAR_ADAPTER_VERSION = '1.8.6';
