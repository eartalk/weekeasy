export interface LikertAnswer {
  readonly value: number;
  readonly reverseScored: boolean;
  readonly weight?: number;
}

export function scoreLikertAnswer(answer: LikertAnswer, maximum = 5): number {
  if (!Number.isInteger(answer.value) || answer.value < 1 || answer.value > maximum) {
    throw new RangeError(`Answer must be an integer between 1 and ${maximum}`);
  }

  const score = answer.reverseScored ? maximum + 1 - answer.value : answer.value;
  return score * (answer.weight ?? 1);
}
