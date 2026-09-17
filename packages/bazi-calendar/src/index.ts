export interface NormalizedBirthTime {
  readonly instant: string;
  readonly timeZone: string;
  readonly isTimeKnown: boolean;
}

export function assertIanaTimeZone(timeZone: string): string {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format();
    return timeZone;
  } catch {
    throw new Error(`Invalid IANA time zone: ${timeZone}`);
  }
}
