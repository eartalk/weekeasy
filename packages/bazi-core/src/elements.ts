import type { EarthlyBranch, HeavenlyStem } from './stem-branch.js';

// 五行与阴阳：命盘结构信号的基础，供十神推导与规则引擎使用。

export type FiveElement = '木' | '火' | '土' | '金' | '水';
export type YinYang = '阳' | '阴';

// 天干五行：甲乙木、丙丁火、戊己土、庚辛金、壬癸水。
const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

// 地支五行：寅卯木、巳午火、辰戌丑未土、申酉金、亥子水。
const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

// 天干阴阳：甲丙戊庚壬为阳，乙丁己辛癸为阴。
const STEM_YIN_YANG: Record<HeavenlyStem, YinYang> = {
  甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳',
  己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴',
};

// 地支阴阳按位置：子寅辰午申戌为阳，丑卯巳未酉亥为阴。
const BRANCH_YIN_YANG: Record<EarthlyBranch, YinYang> = {
  子: '阳', 丑: '阴', 寅: '阳', 卯: '阴', 辰: '阳', 巳: '阴',
  午: '阳', 未: '阴', 申: '阳', 酉: '阴', 戌: '阳', 亥: '阴',
};

export function stemElement(stem: HeavenlyStem): FiveElement {
  return STEM_ELEMENT[stem];
}

export function branchElement(branch: EarthlyBranch): FiveElement {
  return BRANCH_ELEMENT[branch];
}

export function stemYinYang(stem: HeavenlyStem): YinYang {
  return STEM_YIN_YANG[stem];
}

export function branchYinYang(branch: EarthlyBranch): YinYang {
  return BRANCH_YIN_YANG[branch];
}
