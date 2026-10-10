import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthenticatedPrincipal } from '@/domains/auth/types/authenticated-principal';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedPrincipal;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user as AuthenticatedPrincipal;
  },
);
