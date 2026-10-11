import { Transform, Type } from 'class-transformer';
import { IsDefined, IsString, Length, ValidateNested } from 'class-validator';

import { ProjectConfigurationDto } from '@/domains/projects/dto/create-project.dto';

export class UpdateProjectDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 64)
  name: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => ProjectConfigurationDto)
  configuration: ProjectConfigurationDto;
}
