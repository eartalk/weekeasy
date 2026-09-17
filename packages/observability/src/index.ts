const SENSITIVE_KEYS = new Set([
  'authorization', 'birthDate', 'birthTime', 'code', 'email', 'password', 'token',
]);

export function redactMetadata(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, SENSITIVE_KEYS.has(key) ? '[REDACTED]' : value]),
  );
}
