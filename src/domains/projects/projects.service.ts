import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';

import { ProjectLaunchMode, ProjectStatus } from '@/common/enums/project.enums';
import {
  QUICK_LAUNCH_PROJECT_DEFAULTS,
  type ResolvedProjectConfiguration,
} from '@/domains/projects/constants/project-defaults.constant';
import { CreateProjectDto } from '@/domains/projects/dto/create-project.dto';
import { ListProjectsQueryDto } from '@/domains/projects/dto/list-projects-query.dto';
import { UpdateProjectDto } from '@/domains/projects/dto/update-project.dto';
import { Project } from '@/domains/projects/entities/project.entity';
import { ProjectsRepository } from '@/domains/projects/projects.repository';
import type { ProjectPlatform } from '@/domains/projects/types/platform.type';
import type { ProjectListItem } from '@/domains/projects/types/project-list-item.type';
import type { ProjectDetails } from '@/domains/projects/types/project-details.type';
import { PROJECTS_PAGE_SIZE } from '@/domains/projects/constants/project-pagination.constant';
import { PROJECT_PLATFORMS } from '@/domains/projects/constants/project-platforms.constant';
import type { PaginatedData } from '@/types/api';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  getPlatforms(): ProjectPlatform[] {
    return PROJECT_PLATFORMS;
  }

  async getById(
    userId: string | undefined,
    projectId: string,
  ): Promise<ProjectDetails> {
    const project = await this.getOwnedProject(userId, projectId);
    return this.toProjectDetails(project);
  }

  async update(
    userId: string | undefined,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectDetails> {
    const project = await this.getOwnedProject(userId, projectId);
    const configuration = dto.configuration;

    if (
      !PROJECT_PLATFORMS.some(
        (platform) => platform.slug === configuration.platform,
      )
    ) {
      throw new BadRequestException('Unsupported project platform');
    }

    project.name = dto.name.trim();
    project.platform = configuration.platform;
    project.environmentLabel = configuration.environmentLabel?.trim() || null;
    Object.assign(project.settings, {
      maximumStorageGb: configuration.maximumStorageGb,
      retentionDays: configuration.retentionDays,
      archiveExpiredLogs: configuration.archiveExpiredLogs,
      warnNearStorageLimit: configuration.warnNearStorageLimit,
      eventsPerMinute: configuration.eventsPerMinute,
      errorEventsPerMinute: configuration.errorEventsPerMinute,
      maximumEventSizeKb: configuration.maximumEventSizeKb,
      eventsPerBatch: configuration.eventsPerBatch,
      redactAuthorization: configuration.redactAuthorization,
      redactCookies: configuration.redactCookies,
      redactIpAddresses: configuration.redactIpAddresses,
      storeStackTraces: configuration.storeStackTraces,
    });

    const saved = await this.dataSource.transaction((manager) =>
      this.projectsRepository.saveProjectWithSettings(
        project,
        project.settings,
        manager,
      ),
    );
    return this.toProjectDetails(saved);
  }

  async setEnabled(
    userId: string | undefined,
    projectId: string,
    enabled: boolean,
  ): Promise<ProjectDetails> {
    const project = await this.getOwnedProject(userId, projectId);
    project.status = enabled ? ProjectStatus.ACTIVE : ProjectStatus.PAUSED;
    const saved = await this.projectsRepository.saveProject(project);
    return this.toProjectDetails(saved);
  }

  async delete(userId: string | undefined, projectId: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('A user account is required');
    }

    const deleted = await this.projectsRepository.softDeleteForUser(
      projectId,
      userId,
    );
    if (!deleted) {
      throw new NotFoundException('Project not found');
    }
  }

  async list(
    userId: string | undefined,
    query: ListProjectsQueryDto,
  ): Promise<PaginatedData<ProjectListItem>> {
    if (!userId) {
      throw new UnauthorizedException('A user account is required');
    }

    const page = query.page;
    const [projects, totalItems] = await this.projectsRepository.listForUser({
      userId,
      search: query.search,
      status: query.status,
      platform: query.platform,
      skip: (page - 1) * PROJECTS_PAGE_SIZE,
      take: PROJECTS_PAGE_SIZE,
    });
    const totalPages = Math.ceil(totalItems / PROJECTS_PAGE_SIZE);
    const items: ProjectListItem[] = projects.map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      platform: PROJECT_PLATFORMS.find(
        (platform) => platform.slug === project.platform,
      ) ?? {
        name: project.platform,
        slug: project.platform,
        iconUrl: null,
      },
      environmentLabel: project.environmentLabel,
      status: project.status,
      createdAt: project.createdAt,
    }));

    return {
      items,
      pagination: {
        page,
        pageSize: PROJECTS_PAGE_SIZE,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async create(
    userId: string | undefined,
    dto: CreateProjectDto,
  ): Promise<Project> {
    if (!userId) {
      throw new UnauthorizedException('A user account is required');
    }

    let configuration: Readonly<ResolvedProjectConfiguration>;
    if (dto.launchMode === ProjectLaunchMode.QUICK) {
      configuration = QUICK_LAUNCH_PROJECT_DEFAULTS;
    } else {
      if (!dto.configuration) {
        throw new BadRequestException(
          'Configuration is required for configured launch',
        );
      }

      configuration = {
        ...dto.configuration,
        environmentLabel: dto.configuration.environmentLabel?.trim() || null,
      };
    }

    if (
      !PROJECT_PLATFORMS.some(
        (platform) => platform.slug === configuration.platform,
      )
    ) {
      throw new BadRequestException('Unsupported project platform');
    }

    const name = dto.name.trim();
    if (name.length < 3 || name.length > 64) {
      throw new BadRequestException(
        'Project name must contain between 3 and 64 characters',
      );
    }

    const slug = `${this.slugify(name)}-${randomUUID().slice(0, 8)}`;

    return this.dataSource.transaction(async (manager) => {
      const project = await this.projectsRepository.createProject(
        {
          userId,
          name,
          slug,
          platform: configuration.platform,
          environmentLabel: configuration.environmentLabel,
        },
        manager,
      );

      const settings = await this.projectsRepository.createSettings(
        {
          projectId: project.id,
          maximumStorageGb: configuration.maximumStorageGb,
          retentionDays: configuration.retentionDays,
          archiveExpiredLogs: configuration.archiveExpiredLogs,
          warnNearStorageLimit: configuration.warnNearStorageLimit,
          eventsPerMinute: configuration.eventsPerMinute,
          errorEventsPerMinute: configuration.errorEventsPerMinute,
          maximumEventSizeKb: configuration.maximumEventSizeKb,
          eventsPerBatch: configuration.eventsPerBatch,
          redactAuthorization: configuration.redactAuthorization,
          redactCookies: configuration.redactCookies,
          redactIpAddresses: configuration.redactIpAddresses,
          storeStackTraces: configuration.storeStackTraces,
        },
        manager,
      );

      project.settings = settings;
      return project;
    });
  }

  private slugify(value: string): string {
    return (
      value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'project'
    );
  }

  private async getOwnedProject(
    userId: string | undefined,
    projectId: string,
  ): Promise<Project> {
    if (!userId) {
      throw new UnauthorizedException('A user account is required');
    }

    const project = await this.projectsRepository.findForUser(
      projectId,
      userId,
    );
    if (!project?.settings) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private toProjectDetails(project: Project): ProjectDetails {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      status: project.status,
      configuration: {
        platform: project.platform,
        environmentLabel: project.environmentLabel,
        maximumStorageGb: project.settings.maximumStorageGb,
        retentionDays: project.settings.retentionDays,
        archiveExpiredLogs: project.settings.archiveExpiredLogs,
        warnNearStorageLimit: project.settings.warnNearStorageLimit,
        eventsPerMinute: project.settings.eventsPerMinute,
        errorEventsPerMinute: project.settings.errorEventsPerMinute,
        maximumEventSizeKb: project.settings.maximumEventSizeKb,
        eventsPerBatch: project.settings.eventsPerBatch,
        redactAuthorization: project.settings.redactAuthorization,
        redactCookies: project.settings.redactCookies,
        redactIpAddresses: project.settings.redactIpAddresses,
        storeStackTraces: project.settings.storeStackTraces,
      },
    };
  }
}
