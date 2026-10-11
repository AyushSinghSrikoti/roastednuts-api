import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { ProjectLaunchMode } from '@/common/enums/project.enums';

export class ProjectConfigurationDto {
  @IsString()
  @MaxLength(50)
  platform: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(64)
  environmentLabel?: string;

  @IsInt()
  @IsIn([1, 5, 10, 25])
  maximumStorageGb: number;

  @IsInt()
  @IsIn([1, 3, 7, 30])
  retentionDays: number;

  @IsBoolean()
  archiveExpiredLogs: boolean;

  @IsBoolean()
  warnNearStorageLimit: boolean;

  @IsInt()
  @Min(1)
  @Max(1_000)
  eventsPerMinute: number;

  @IsInt()
  @Min(1)
  @Max(250)
  errorEventsPerMinute: number;

  @IsInt()
  @IsIn([16, 32, 64, 128])
  maximumEventSizeKb: number;

  @IsInt()
  @Min(1)
  @Max(100)
  eventsPerBatch: number;

  @IsBoolean()
  redactAuthorization: boolean;

  @IsBoolean()
  redactCookies: boolean;

  @IsBoolean()
  redactIpAddresses: boolean;

  @IsBoolean()
  storeStackTraces: boolean;
}

export class CreateProjectDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 64)
  name: string;

  @IsEnum(ProjectLaunchMode)
  launchMode: ProjectLaunchMode;

  @ValidateIf(
    (dto: CreateProjectDto) => dto.launchMode === ProjectLaunchMode.CONFIGURED,
  )
  @IsDefined()
  @ValidateNested()
  @Type(() => ProjectConfigurationDto)
  configuration?: ProjectConfigurationDto;
}
