import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { AuthSessionsRepository } from '@/domains/auth/auth-sessions.repository';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import type { AuthenticatedPrincipal } from '@/domains/auth/types/authenticated-principal';

type AuthenticatedRequest = Request & { user?: AuthenticatedPrincipal };

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionsRepository: AuthSessionsRepository,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AuthenticatedPrincipal>(token);

      if (payload.type === 'admin' && payload.role === 'admin') {
        request.user = payload;
        return true;
      }

      if (payload.type !== 'access' || !payload.sid || !payload.sub) {
        throw new UnauthorizedException('Invalid access token');
      }

      const session = await this.sessionsRepository.findActiveById(payload.sid);

      if (!session || session.userId !== payload.sub) {
        throw new UnauthorizedException('Session has been revoked');
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
