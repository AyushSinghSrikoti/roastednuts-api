import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from 'src/global/constants/validation.constants';
import { Match } from 'src/global/decorators/match.decorator';

export class SignUpDto {
  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password: string;

  @IsString()
  @Match('password')
  confirmPassword: string;
}
