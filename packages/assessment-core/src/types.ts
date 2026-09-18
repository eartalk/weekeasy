// Big Five 的稳定维度代码，供题库、计分结果和后续交叉分析共同使用。
export const BIG_FIVE_DIMENSIONS = [
  'OPENNESS',
  'CONSCIENTIOUSNESS',
  'EXTRAVERSION',
  'AGREEABLENESS',
  'NEUROTICISM',
] as const;

export type BigFiveDimension = (typeof BIG_FIVE_DIMENSIONS)[number];

export interface LikertScale {
  readonly minimum: number;
  readonly maximum: number;
}

export interface AssessmentQuestionDefinition {
  readonly code: string;
  readonly dimension: BigFiveDimension;
  readonly reverseScored: boolean;
  readonly weight?: number;
}

export interface AssessmentValidityRules {
  // 完整度低于该值时，结果只作为未完成快照，不能作为正式测评结果。
  readonly minimumCompletionRatio: number;
  // 同一选项占比高于该值时，标记为可能的同值作答；1 表示关闭此检查。
  readonly maximumSameAnswerRatio: number;
  readonly minimumDurationSeconds?: number;
}

export interface BigFiveAssessmentDefinition {
  readonly code: string;
  readonly version: string;
  readonly scale: LikertScale;
  readonly questions: readonly AssessmentQuestionDefinition[];
  readonly validityRules: AssessmentValidityRules;
}

export interface AssessmentAnswer {
  readonly questionCode: string;
  readonly value: number;
}

export interface AssessmentMetadata {
  readonly durationSeconds?: number;
}

export interface DimensionScore {
  readonly rawScore: number | null;
  readonly normalizedScore: number | null;
  readonly answeredQuestions: number;
  readonly totalQuestions: number;
}

export type AssessmentValidityIssue =
  | 'INCOMPLETE_ANSWERS'
  | 'STRAIGHT_LINING'
  | 'TOO_FAST';

export interface AssessmentValidity {
  readonly isValid: boolean;
  readonly completionRatio: number;
  readonly sameAnswerRatio: number;
  readonly durationSeconds: number | null;
  readonly issues: readonly AssessmentValidityIssue[];
}

export interface BigFiveAssessmentResult {
  readonly definitionCode: string;
  readonly definitionVersion: string;
  readonly dimensions: Readonly<Record<BigFiveDimension, DimensionScore>>;
  readonly dataCompleteness: number;
  readonly validity: AssessmentValidity;
}

export type AssessmentErrorCode =
  | 'ASSESSMENT_INVALID_DEFINITION'
  | 'ASSESSMENT_DUPLICATE_ANSWER'
  | 'ASSESSMENT_UNKNOWN_QUESTION'
  | 'ASSESSMENT_INVALID_ANSWER';

export class AssessmentScoringError extends Error {
  public constructor(
    public readonly code: AssessmentErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = 'AssessmentScoringError';
  }
}
