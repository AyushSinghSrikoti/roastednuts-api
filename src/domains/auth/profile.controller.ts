import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthService } from '@/domains/auth/auth.service';
import type { AuthenticatedPrincipal } from '@/domains/auth/types/authenticated-principal';
import type { CurrentUserResponse } from '@/domains/auth/types';
import type { ApiResponse } from '@/types/api';

@Controller('auth')
export class ProfileController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  me(
    @CurrentUser() principal: AuthenticatedPrincipal,
  ): Promise<ApiResponse<CurrentUserResponse>> {
    return this.authService.getCurrentUser(principal);
  }
}
