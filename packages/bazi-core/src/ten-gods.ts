import type { HeavenlyStem } from './stem-branch.js';
import { stemElement, stemYinYang, type FiveElement } from './elements.js';

export type TenGod =
  | '比肩' | '劫财' | '食神' | '伤官' | '偏财'
  | '正财' | '七杀' | '正官' | '偏印' | '正印';

// 五行相生：木→火→土→金→水→木。
const GENERATES: Record<FiveElement, FiveElement> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};

// 五行相克：木→土→水→火→金→木。
const CONTROLS: Record<FiveElement, FiveElement> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

// 由日主天干与被看天干推导十神。
export function tenGod(dayStem: HeavenlyStem, otherStem: HeavenlyStem): TenGod {
  const dayElement = stemElement(dayStem);
  const otherElement = stemElement(otherStem);
  const sameYinYang = stemYinYang(dayStem) === stemYinYang(otherStem);

  if (dayElement === otherElement) {
    return sameYinYang ? '比肩' : '劫财';
  }
  if (GENERATES[dayElement] === otherElement) {
    // 我生
    return sameYinYang ? '食神' : '伤官';
  }
  if (CONTROLS[dayElement] === otherElement) {
    // 我克
    return sameYinYang ? '偏财' : '正财';
  }
  if (CONTROLS[otherElement] === dayElement) {
    // 克我
    return sameYinYang ? '七杀' : '正官';
  }
  // 生我
  return sameYinYang ? '偏印' : '正印';
}
