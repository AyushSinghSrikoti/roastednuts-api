import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Public } from '@/common/decorators/public.decorator';
import { AuthService } from '@/domains/auth/auth.service';
import { LoginDto } from '@/domains/auth/dto/login.dto';
import type { SignupResponse } from '@/domains/auth/types';
import type { ApiResponse } from '@/types/api';

@Controller()
@Public()
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<ApiResponse<SignupResponse>> {
    return this.authService.login(dto);
  }
}
