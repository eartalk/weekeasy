import { Solar } from 'lunar-typescript';
import type { ResolvedBirthInstant } from './birth-instant.js';

export interface PillarIndices {
  readonly stem: number; // 0-9 对应甲乙丙丁戊己庚辛壬癸
  readonly branch: number; // 0-11 对应子丑寅卯辰巳午未申酉戌亥
}

export interface FourPillarIndices {
  readonly year: PillarIndices;
  readonly month: PillarIndices;
  readonly day: PillarIndices;
  readonly hour: PillarIndices | null;
}

// 晚子时（23:00-24:00）日柱是否算次日的换日策略。
export type DayBoundaryRule = 'MIDNIGHT' | 'LATE_ZI_HOUR';

const GAN = '甲乙丙丁戊己庚辛壬癸';
const ZHI = '子丑寅卯辰巳午未申酉戌亥';

function ganIndex(gan: string): number {
  const index = GAN.indexOf(gan);
  if (index < 0) {
    throw new Error(`CHART_UNKNOWN_STEM: 无法识别的天干「${gan}」`);
  }
  return index;
}

function zhiIndex(zhi: string): number {
  const index = ZHI.indexOf(zhi);
  if (index < 0) {
    throw new Error(`CHART_UNKNOWN_BRANCH: 无法识别的地支「${zhi}」`);
  }
  return index;
}

export function computeFourPillarIndices(
  resolved: ResolvedBirthInstant,
  dayBoundaryRule: DayBoundaryRule,
): FourPillarIndices {
  const { year, month, day, hour, minute } = resolved.chartLocalDateTime;
  const localEightChar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
  const reference = resolved.solarTermDateTime;
  const solarTermEightChar = Solar.fromYmdHms(
    reference.year, reference.month, reference.day, reference.hour, reference.minute, 0,
  ).getLunar().getEightChar();
  // 换日策略映射：MIDNIGHT（午夜换日，晚子时算当天）→ sect 2；
  // LATE_ZI_HOUR（晚子时换日，23:00 起算次日）→ sect 1。
  localEightChar.setSect(dayBoundaryRule === 'LATE_ZI_HOUR' ? 1 : 2);

  return {
    year: { stem: ganIndex(solarTermEightChar.getYearGan()), branch: zhiIndex(solarTermEightChar.getYearZhi()) },
    month: { stem: ganIndex(solarTermEightChar.getMonthGan()), branch: zhiIndex(solarTermEightChar.getMonthZhi()) },
    day: { stem: ganIndex(localEightChar.getDayGan()), branch: zhiIndex(localEightChar.getDayZhi()) },
    hour: resolved.isTimeKnown
      ? { stem: ganIndex(localEightChar.getTimeGan()), branch: zhiIndex(localEightChar.getTimeZhi()) }
      : null,
  };
}
