import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';

import { Project } from '@/domains/projects/entities/project.entity';
import { ProjectSettings } from '@/domains/projects/entities/project-settings.entity';

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  createProject(
    input: DeepPartial<Project>,
    manager: EntityManager,
  ): Promise<Project> {
    const repository = manager.getRepository(Project);
    return repository.save(repository.create(input));
  }

  createSettings(
    input: DeepPartial<ProjectSettings>,
    manager: EntityManager,
  ): Promise<ProjectSettings> {
    const repository = manager.getRepository(ProjectSettings);
    return repository.save(repository.create(input));
  }

  findForUser(projectId: string, userId: string): Promise<Project | null> {
    return this.projects.findOne({
      where: { id: projectId, userId },
      relations: { settings: true },
    });
  }

  async saveProjectWithSettings(
    project: Project,
    settings: ProjectSettings,
    manager: EntityManager,
  ): Promise<Project> {
    await manager.getRepository(ProjectSettings).save(settings);
    project.settings = settings;
    return manager.getRepository(Project).save(project);
  }

  saveProject(project: Project): Promise<Project> {
    return this.projects.save(project);
  }

  async softDeleteForUser(projectId: string, userId: string): Promise<boolean> {
    const result = await this.projects.softDelete({ id: projectId, userId });
    return result.affected === 1;
  }

  listForUser(input: {
    userId: string;
    search?: string;
    status?: Project['status'];
    platform?: string;
    skip: number;
    take: number;
  }): Promise<[Project[], number]> {
    const query = this.projects
      .createQueryBuilder('project')
      .select([
        'project.id',
        'project.name',
        'project.slug',
        'project.platform',
        'project.environmentLabel',
        'project.status',
        'project.createdAt',
      ])
      .where('project.userId = :userId', { userId: input.userId })
      .orderBy('project.createdAt', 'DESC')
      .addOrderBy('project.id', 'DESC')
      .skip(input.skip)
      .take(input.take);

    if (input.search) {
      const escapedSearch = input.search.replace(/[\\%_]/g, '\\$&');
      query.andWhere(
        "(project.name ILIKE :search ESCAPE '\\' OR project.slug ILIKE :search ESCAPE '\\')",
        { search: `%${escapedSearch}%` },
      );
    }

    if (input.status) {
      query.andWhere('project.status = :status', { status: input.status });
    }

    if (input.platform) {
      query.andWhere('project.platform = :platform', {
        platform: input.platform,
      });
    }

    return query.getManyAndCount();
  }
}
