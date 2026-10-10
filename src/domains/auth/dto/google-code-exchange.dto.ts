import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleCodeExchangeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
