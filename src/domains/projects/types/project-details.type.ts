import type { ProjectStatus } from '@/common/enums/project.enums';

export interface ProjectDetails {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  configuration: {
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
  };
}
