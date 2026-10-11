import type { ProjectStatus } from '@/common/enums/project.enums';
import type { ProjectPlatform } from '@/domains/projects/types/platform.type';

export interface ProjectListItem {
  id: string;
  name: string;
  slug: string;
  platform: ProjectPlatform;
  environmentLabel: string | null;
  status: ProjectStatus;
  createdAt: Date;
}
