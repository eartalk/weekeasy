import type { AssessmentResultResponse, BigFiveDimension } from '@weekeasy/api-contracts';

export const LIKERT_OPTIONS = [
  { value: 1, label: '非常不符合', shortLabel: '完全不像' },
  { value: 2, label: '比较不符合', shortLabel: '不太像' },
  { value: 3, label: '不确定', shortLabel: '居中' },
  { value: 4, label: '比较符合', shortLabel: '比较像' },
  { value: 5, label: '非常符合', shortLabel: '很像我' },
] as const;

export const DIMENSION_PRESENTATION: Readonly<Record<BigFiveDimension, {
  readonly name: string;
  readonly english: string;
  readonly low: string;
  readonly high: string;
  readonly description: string;
}>> = {
  OPENNESS: {
    name: '开放性', english: 'OPENNESS', low: '具体务实', high: '想象探索',
    description: '反映对新想法、抽象概念与想象活动的倾向。',
  },
  CONSCIENTIOUSNESS: {
    name: '尽责性', english: 'CONSCIENTIOUSNESS', low: '灵活随性', high: '计划有序',
    description: '反映组织、计划、持续完成任务的倾向。',
  },
  EXTRAVERSION: {
    name: '外向性', english: 'EXTRAVERSION', low: '安静内敛', high: '活跃外向',
    description: '反映从社交互动和外部刺激中获得能量的倾向。',
  },
  AGREEABLENESS: {
    name: '宜人性', english: 'AGREEABLENESS', low: '独立直率', high: '体谅合作',
    description: '反映以同理、信任与合作方式回应他人的倾向。',
  },
  NEUROTICISM: {
    name: '情绪敏感性', english: 'NEUROTICISM', low: '平稳松弛', high: '敏感易波动',
    description: '反映对压力和负面情绪的感受强度，不代表心理诊断。',
  },
};

export function orderedDimensionResults(result: AssessmentResultResponse) {
  return (Object.keys(DIMENSION_PRESENTATION) as BigFiveDimension[]).map((dimension) => ({
    dimension,
    ...DIMENSION_PRESENTATION[dimension],
    score: result.dimensions[dimension].normalizedScore ?? 0,
  }));
}
