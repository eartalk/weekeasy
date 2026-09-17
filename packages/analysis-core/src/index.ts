export type ComparisonKind = 'agreement' | 'complement' | 'conflict' | 'uncertain';

export interface CrossModelFinding {
  readonly dimension: string;
  readonly kind: ComparisonKind;
  readonly confidence: number;
  readonly evidenceCodes: readonly string[];
}

export interface AnalysisSnapshot {
  readonly schemaVersion: string;
  readonly ruleSetVersion: string;
  readonly dataCompleteness: number;
  readonly confidence: number;
  readonly findings: readonly CrossModelFinding[];
}
