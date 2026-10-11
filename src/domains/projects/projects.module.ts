import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsController } from '@/domains/projects/projects.controller';
import { Project } from '@/domains/projects/entities/project.entity';
import { ProjectSettings } from '@/domains/projects/entities/project-settings.entity';
import { ProjectsRepository } from '@/domains/projects/projects.repository';
import { ProjectsService } from '@/domains/projects/projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectSettings])],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
