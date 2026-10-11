import { IsBoolean } from 'class-validator';

export class UpdateProjectStatusDto {
  @IsBoolean()
  enabled: boolean;
}
