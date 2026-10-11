export interface ResolvedProjectConfiguration {
  platform: string;
  environmentLabel: string | null;
  maximumStorageGb: number;
  retentionDays: number;
  archiveExpiredLogs: boolean;
  warnNearStorageLimit: boolean;
  eventsPerMinute: number;
  errorEventsPerMinute: number;
  maximumEventSizeKb: number;
  eventsPerBatch: number;
  redactAuthorization: boolean;
  redactCookies: boolean;
  redactIpAddresses: boolean;
  storeStackTraces: boolean;
}

export const QUICK_LAUNCH_PROJECT_DEFAULTS: Readonly<ResolvedProjectConfiguration> =
  Object.freeze({
    platform: 'other',
    environmentLabel: null,
    maximumStorageGb: 1,
    retentionDays: 7,
    archiveExpiredLogs: false,
    warnNearStorageLimit: true,
    eventsPerMinute: 1_000,
    errorEventsPerMinute: 250,
    maximumEventSizeKb: 64,
    eventsPerBatch: 100,
    redactAuthorization: true,
    redactCookies: true,
    redactIpAddresses: false,
    storeStackTraces: true,
  });
