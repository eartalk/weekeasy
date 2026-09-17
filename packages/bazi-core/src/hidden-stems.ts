import type { EarthlyBranch, HeavenlyStem } from './stem-branch.js';

// 地支藏干：每个地支所藏的天干，首位为本气（主气），其余为中气、余气。
const HIDDEN_STEMS: Record<EarthlyBranch, readonly HeavenlyStem[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

export function hiddenStemsOf(branch: EarthlyBranch): readonly HeavenlyStem[] {
  return HIDDEN_STEMS[branch];
}
