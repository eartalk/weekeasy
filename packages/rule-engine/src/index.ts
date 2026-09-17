export type SignalDirection = 'positive' | 'negative';

export interface RuleEvidence {
  readonly ruleCode: string;
  readonly dimension: string;
  readonly direction: SignalDirection;
  readonly weight: number;
  readonly confidence: number;
}

export interface DimensionScore {
  readonly dimension: string;
  readonly score: number;
  readonly confidence: number;
  readonly evidence: readonly RuleEvidence[];
}
