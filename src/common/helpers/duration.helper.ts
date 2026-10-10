const MILLISECONDS_BY_UNIT = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

export function parseDurationToMilliseconds(
  value: string,
  configurationName: string,
): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());

  if (!match) {
    throw new Error(
      `${configurationName} must use a value such as 30d, 12h, 30m, or 60s`,
    );
  }

  return (
    Number(match[1]) *
    MILLISECONDS_BY_UNIT[match[2] as keyof typeof MILLISECONDS_BY_UNIT]
  );
}
