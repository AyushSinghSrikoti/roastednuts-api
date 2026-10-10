import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

import { Match } from '@/common/validators/match.validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/\d/, { message: 'Password must contain a number' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Password must contain a special character',
  })
  password: string;

  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
