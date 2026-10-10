import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';

import { Public } from '@/common/decorators/public.decorator';
import { LoggerService } from '@/common/services/logger.service';
import { AuthService } from '@/domains/auth/auth.service';
import { AdminLoginDto } from '@/domains/auth/dto/admin-login.dto';
import type { LoginResponse } from '@/domains/auth/types';
import type { ApiResponse } from '@/types/api';

@Controller('admin')
@Public()
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loggerService: LoggerService,
  ) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto): ApiResponse<LoginResponse> {
    try {
      return this.authService.adminLogin(dto);
    } catch (error) {
      this.loggerService.logError(error);
      throw new UnauthorizedException('Invalid administrator credentials');
    }
  }
}
