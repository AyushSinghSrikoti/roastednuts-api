import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateProjectDto } from '@/domains/projects/dto/create-project.dto';
import { ListProjectsQueryDto } from '@/domains/projects/dto/list-projects-query.dto';
import { UpdateProjectDto } from '@/domains/projects/dto/update-project.dto';
import { UpdateProjectStatusDto } from '@/domains/projects/dto/update-project-status.dto';
import { Project } from '@/domains/projects/entities/project.entity';
import { ProjectsService } from '@/domains/projects/projects.service';
import type { ProjectPlatform } from '@/domains/projects/types/platform.type';
import type { ProjectListItem } from '@/domains/projects/types/project-list-item.type';
import type { ProjectDetails } from '@/domains/projects/types/project-details.type';
import type { AuthenticatedPrincipal } from '@/domains/auth/types/authenticated-principal';
import type { ApiResponse, PaginatedData } from '@/types/api';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('platforms')
  getPlatforms(): ApiResponse<ProjectPlatform[]> {
    return {
      data: this.projectsService.getPlatforms(),
      message: 'Project platforms retrieved successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @Get()
  async list(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Query() query: ListProjectsQueryDto,
  ): Promise<ApiResponse<PaginatedData<ProjectListItem>>> {
    return {
      data: await this.projectsService.list(principal.sub, query),
      message: 'Projects retrieved successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  async create(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() dto: CreateProjectDto,
  ): Promise<ApiResponse<Project>> {
    return {
      data: await this.projectsService.create(principal.sub, dto),
      message: 'Project created successfully',
      statusCode: HttpStatus.CREATED,
    };
  }

  @Get(':id')
  async getById(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', new ParseUUIDPipe()) projectId: string,
  ): Promise<ApiResponse<ProjectDetails>> {
    return {
      data: await this.projectsService.getById(principal.sub, projectId),
      message: 'Project retrieved successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ApiResponse<ProjectDetails>> {
    return {
      data: await this.projectsService.update(principal.sub, projectId, dto),
      message: 'Project updated successfully',
      statusCode: HttpStatus.OK,
    };
  }

  @Patch(':id/status')
  async setEnabled(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @Body() dto: UpdateProjectStatusDto,
  ): Promise<ApiResponse<ProjectDetails>> {
    return {
      data: await this.projectsService.setEnabled(
        principal.sub,
        projectId,
        dto.enabled,
      ),
      message: `Project ${dto.enabled ? 'enabled' : 'disabled'} successfully`,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Param('id', new ParseUUIDPipe()) projectId: string,
  ): Promise<ApiResponse<null>> {
    await this.projectsService.delete(principal.sub, projectId);
    return {
      data: null,
      message: 'Project deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
