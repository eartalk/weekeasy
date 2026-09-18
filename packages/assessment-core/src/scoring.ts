import {
  AssessmentScoringError,
  BIG_FIVE_DIMENSIONS,
  type AssessmentAnswer,
  type AssessmentMetadata,
  type AssessmentQuestionDefinition,
  type AssessmentValidity,
  type AssessmentValidityIssue,
  type BigFiveAssessmentDefinition,
  type BigFiveAssessmentResult,
  type BigFiveDimension,
  type DimensionScore,
  type LikertScale,
} from './types.js';

export interface LikertAnswer {
  readonly value: number;
  readonly reverseScored: boolean;
  readonly weight?: number;
}

function failDefinition(message: string): never {
  throw new AssessmentScoringError('ASSESSMENT_INVALID_DEFINITION', message);
}

function assertRatio(value: number, name: string, allowZero: boolean): void {
  const validMinimum = allowZero ? value >= 0 : value > 0;
  if (!Number.isFinite(value) || !validMinimum || value > 1) {
    failDefinition(`${name} 必须在${allowZero ? ' 0 到 1' : ' 0（不含）到 1'}之间`);
  }
}

// 在计分前一次性校验版本化定义，避免错误配置生成看似正常的正式结果。
export function validateAssessmentDefinition(definition: BigFiveAssessmentDefinition): void {
  if (definition.code.trim() === '' || definition.version.trim() === '') {
    failDefinition('问卷代码和版本不能为空');
  }
  const { minimum, maximum } = definition.scale;
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum >= maximum) {
    failDefinition('量表上下限必须是递增整数');
  }
  if (definition.questions.length === 0) failDefinition('问卷至少需要一道题');

  const codes = new Set<string>();
  const coveredDimensions = new Set<BigFiveDimension>();
  for (const question of definition.questions) {
    if (question.code.trim() === '') failDefinition('题目代码不能为空');
    if (codes.has(question.code)) failDefinition(`题目代码重复「${question.code}」`);
    codes.add(question.code);
    coveredDimensions.add(question.dimension);
    const weight = question.weight ?? 1;
    if (!Number.isFinite(weight) || weight <= 0) failDefinition(`题目「${question.code}」权重必须大于 0`);
  }
  for (const dimension of BIG_FIVE_DIMENSIONS) {
    if (!coveredDimensions.has(dimension)) failDefinition(`缺少维度「${dimension}」的题目`);
  }

  assertRatio(definition.validityRules.minimumCompletionRatio, '最低完整度', false);
  assertRatio(definition.validityRules.maximumSameAnswerRatio, '同值作答阈值', true);
  const minimumDuration = definition.validityRules.minimumDurationSeconds;
  if (minimumDuration !== undefined && (!Number.isFinite(minimumDuration) || minimumDuration < 0)) {
    failDefinition('最短作答时间不能为负数');
  }
}

export function scoreLikertAnswer(answer: LikertAnswer, scale: LikertScale = { minimum: 1, maximum: 5 }): number {
  if (
    !Number.isInteger(scale.minimum) ||
    !Number.isInteger(scale.maximum) ||
    scale.minimum >= scale.maximum
  ) {
    failDefinition('量表上下限必须是递增整数');
  }
  if (!Number.isInteger(answer.value) || answer.value < scale.minimum || answer.value > scale.maximum) {
    throw new AssessmentScoringError(
      'ASSESSMENT_INVALID_ANSWER',
      `答案必须是 ${scale.minimum} 到 ${scale.maximum} 之间的整数`,
    );
  }
  const weight = answer.weight ?? 1;
  if (!Number.isFinite(weight) || weight <= 0) failDefinition('题目权重必须大于 0');
  const score = answer.reverseScored
    ? scale.minimum + scale.maximum - answer.value
    : answer.value;
  return score * weight;
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function buildAnswerMap(
  definition: BigFiveAssessmentDefinition,
  answers: readonly AssessmentAnswer[],
): ReadonlyMap<string, number> {
  const questions = new Set(definition.questions.map((question) => question.code));
  const answerMap = new Map<string, number>();
  for (const answer of answers) {
    if (!questions.has(answer.questionCode)) {
      throw new AssessmentScoringError('ASSESSMENT_UNKNOWN_QUESTION', `未知题目「${answer.questionCode}」`);
    }
    if (answerMap.has(answer.questionCode)) {
      throw new AssessmentScoringError('ASSESSMENT_DUPLICATE_ANSWER', `题目「${answer.questionCode}」重复作答`);
    }
    scoreLikertAnswer({ value: answer.value, reverseScored: false }, definition.scale);
    answerMap.set(answer.questionCode, answer.value);
  }
  return answerMap;
}

function scoreDimension(
  questions: readonly AssessmentQuestionDefinition[],
  answers: ReadonlyMap<string, number>,
  scale: LikertScale,
): DimensionScore {
  let weightedScore = 0;
  let answeredWeight = 0;
  let answeredQuestions = 0;
  for (const question of questions) {
    const value = answers.get(question.code);
    if (value === undefined) continue;
    const weight = question.weight ?? 1;
    weightedScore += scoreLikertAnswer({ value, reverseScored: question.reverseScored, weight }, scale);
    answeredWeight += weight;
    answeredQuestions += 1;
  }
  if (answeredQuestions === 0) {
    return { rawScore: null, normalizedScore: null, answeredQuestions: 0, totalQuestions: questions.length };
  }
  const rawScore = weightedScore / answeredWeight;
  const normalizedScore = ((rawScore - scale.minimum) / (scale.maximum - scale.minimum)) * 100;
  return {
    rawScore: round(rawScore),
    normalizedScore: round(normalizedScore),
    answeredQuestions,
    totalQuestions: questions.length,
  };
}

function sameAnswerRatio(answers: readonly AssessmentAnswer[]): number {
  if (answers.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const answer of answers) counts.set(answer.value, (counts.get(answer.value) ?? 0) + 1);
  return Math.max(...counts.values()) / answers.length;
}

function assessValidity(
  definition: BigFiveAssessmentDefinition,
  answers: readonly AssessmentAnswer[],
  metadata: AssessmentMetadata,
): AssessmentValidity {
  const completionRatio = answers.length / definition.questions.length;
  const repeatedRatio = sameAnswerRatio(answers);
  const issues: AssessmentValidityIssue[] = [];
  if (completionRatio < definition.validityRules.minimumCompletionRatio) issues.push('INCOMPLETE_ANSWERS');
  if (repeatedRatio > definition.validityRules.maximumSameAnswerRatio) issues.push('STRAIGHT_LINING');
  const minimumDuration = definition.validityRules.minimumDurationSeconds;
  if (
    minimumDuration !== undefined &&
    metadata.durationSeconds !== undefined &&
    metadata.durationSeconds < minimumDuration
  ) {
    issues.push('TOO_FAST');
  }
  return {
    isValid: issues.length === 0,
    completionRatio: round(completionRatio),
    sameAnswerRatio: round(repeatedRatio),
    durationSeconds: metadata.durationSeconds ?? null,
    issues,
  };
}

// 计分结果是不可变快照：包含定义版本、五维得分、完整度和有效性证据。
export function scoreBigFiveAssessment(
  definition: BigFiveAssessmentDefinition,
  answers: readonly AssessmentAnswer[],
  metadata: AssessmentMetadata = {},
): BigFiveAssessmentResult {
  validateAssessmentDefinition(definition);
  if (metadata.durationSeconds !== undefined && (!Number.isFinite(metadata.durationSeconds) || metadata.durationSeconds < 0)) {
    throw new AssessmentScoringError('ASSESSMENT_INVALID_ANSWER', '作答时长不能为负数');
  }
  const answerMap = buildAnswerMap(definition, answers);
  const dimensions = Object.fromEntries(BIG_FIVE_DIMENSIONS.map((dimension) => [
    dimension,
    scoreDimension(
      definition.questions.filter((question) => question.dimension === dimension),
      answerMap,
      definition.scale,
    ),
  ])) as Record<BigFiveDimension, DimensionScore>;
  const validity = assessValidity(definition, answers, metadata);
  return {
    definitionCode: definition.code,
    definitionVersion: definition.version,
    dimensions,
    dataCompleteness: validity.completionRatio,
    validity,
  };
}
