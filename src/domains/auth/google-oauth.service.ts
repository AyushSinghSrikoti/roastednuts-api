import {
  BadGatewayException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import axios from 'axios';
import { DataSource, EntityManager } from 'typeorm';

import { UserStatus } from '@/common/enums/user.enums';
import { parseDurationToMilliseconds } from '@/common/helpers/duration.helper';
import { HttpService } from '@/common/services/http.service';
import { AuthService } from '@/domains/auth/auth.service';
import { GOOGLE_OAUTH } from '@/domains/auth/constants/google-oauth.constants';
import { OAuthLoginCodesRepository } from '@/domains/auth/oauth-login-codes.repository';
import type {
  GoogleAuthorizationRequest,
  GoogleCallbackInput,
  GoogleLoginResult,
  GoogleOAuthStatePayload,
  GoogleTokenResponse,
  GoogleUserInfoResponse,
} from '@/domains/auth/interfaces/google-oauth.interface';
import type { GoogleProfile, SignupResponse } from '@/domains/auth/types';
import { UsersService } from '@/domains/users/users.service';

@Injectable()
export class GoogleOAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly httpService: HttpService,
    private readonly loginCodesRepository: OAuthLoginCodesRepository,
    private readonly dataSource: DataSource,
  ) {}

  createAuthorizationRequest(): GoogleAuthorizationRequest {
    const state = this.createState();
    const parameters = new URLSearchParams({
      client_id: this.getRequiredConfig('GOOGLE_CLIENT_ID'),
      redirect_uri: this.getRequiredConfig('GOOGLE_CALLBACK_URL'),
      response_type: GOOGLE_OAUTH.RESPONSE_TYPE,
      scope: GOOGLE_OAUTH.SCOPE,
      state,
      prompt: GOOGLE_OAUTH.PROMPT,
    });

    return {
      state,
      authorizationUrl: `${this.getRequiredConfig('GOOGLE_AUTHORIZATION_URL')}?${parameters.toString()}`,
      stateMaxAge: this.getStateTtlMilliseconds(),
      secureCookie:
        this.configService.get<string>(
          'GOOGLE_OAUTH_COOKIE_SECURE',
          'false',
        ) === 'true',
    };
  }

  async handleCallback(input: GoogleCallbackInput): Promise<string> {
    const cookieState = this.getCookie(
      input.cookieHeader,
      GOOGLE_OAUTH.STATE_COOKIE_NAME,
    );

    if (
      input.oauthError ||
      !input.code ||
      !input.state ||
      !cookieState ||
      input.state !== cookieState
    ) {
      throw new UnauthorizedException(
        input.oauthError ?? 'Invalid Google OAuth callback',
      );
    }

    this.verifyState(input.state);

    const accessToken = await this.exchangeAuthorizationCode(input.code);
    const profile = await this.getGoogleProfile(accessToken);

    const code = randomBytes(48).toString('base64url');
    await this.loginCodesRepository.create(
      this.hashCode(code),
      profile,
      new Date(
        Date.now() +
          parseDurationToMilliseconds(
            this.configService.get<string>('GOOGLE_LOGIN_CODE_TTL', '2m'),
            'GOOGLE_LOGIN_CODE_TTL',
          ),
      ),
    );

    return code;
  }

  getSuccessRedirectUrl(): string {
    return this.getRequiredConfig('GOOGLE_SUCCESS_REDIRECT_URL');
  }

  getFailureRedirectUrl(): string {
    return this.getRequiredConfig('GOOGLE_FAILURE_REDIRECT_URL');
  }

  private createState(): string {
    return this.jwtService.sign(
      {
        nonce: randomBytes(32).toString('hex'),
        type: GOOGLE_OAUTH.STATE_TYPE,
      },
      {
        secret: this.getRequiredConfig('GOOGLE_OAUTH_STATE_SECRET'),
        expiresIn: this.getStateTtl() as JwtSignOptions['expiresIn'],
      },
    );
  }

  private verifyState(state: string): void {
    try {
      const payload = this.jwtService.verify<GoogleOAuthStatePayload>(state, {
        secret: this.getRequiredConfig('GOOGLE_OAUTH_STATE_SECRET'),
      });

      if (payload.type !== GOOGLE_OAUTH.STATE_TYPE) {
        throw new Error('Unexpected OAuth state type');
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired Google OAuth state');
    }
  }

  async exchangeLoginCode(code: string): Promise<SignupResponse> {
    const result = await this.dataSource.transaction(async (manager) => {
      const loginCode = await this.loginCodesRepository.findActiveForUpdate(
        this.hashCode(code),
        manager,
      );

      if (!loginCode) {
        throw new UnauthorizedException('Invalid or expired Google login code');
      }

      const response = await this.login(loginCode.profile, manager);
      await this.loginCodesRepository.consume(loginCode.id, manager);

      return response;
    });

    if (result.isNewUser) {
      await this.authService.sendWelcomeEmail(result.response.user.email);
    }

    return result.response;
  }

  private async login(
    profile: GoogleProfile,
    manager: EntityManager,
  ): Promise<GoogleLoginResult> {
    if (!profile.emailVerified) {
      throw new UnauthorizedException('Google email address is not verified');
    }

    let isNewUser = false;
    let user = await this.usersService.findByGoogleSubject(
      profile.sub,
      manager,
    );

    if (!user) {
      user = await this.usersService.findByEmail(profile.email, manager);

      if (user?.googleSubject && user.googleSubject !== profile.sub) {
        throw new ConflictException(
          'This email is already linked to another Google account',
        );
      }

      if (user) {
        await this.usersService.linkGoogleIdentity(
          user.id,
          profile.sub,
          profile.name,
          profile.picture,
          manager,
        );
        user.googleSubject = profile.sub;
        user.name = profile.name;
        user.avatarUrl = profile.picture;
      } else {
        user = await this.usersService.createGoogleUser(
          {
            email: profile.email,
            googleSubject: profile.sub,
            name: profile.name,
            avatarUrl: profile.picture,
          },
          manager,
        );
        isNewUser = true;
      }
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active');
    }

    const tokens = await this.authService.createUserSession(user, manager);
    await this.usersService.updateLastLogin(user.id, manager);

    return {
      isNewUser,
      response: {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private async exchangeAuthorizationCode(code: string): Promise<string> {
    try {
      const result = await this.httpService.post<GoogleTokenResponse>(
        this.getRequiredConfig('GOOGLE_TOKEN_URL'),
        new URLSearchParams({
          code,
          client_id: this.getRequiredConfig('GOOGLE_CLIENT_ID'),
          client_secret: this.getRequiredConfig('GOOGLE_CLIENT_SECRET'),
          redirect_uri: this.getRequiredConfig('GOOGLE_CALLBACK_URL'),
          grant_type: GOOGLE_OAUTH.GRANT_TYPE,
        }),
        {
          headers: { 'Content-Type': GOOGLE_OAUTH.FORM_CONTENT_TYPE },
        },
      );

      if (!result.access_token) {
        throw new BadGatewayException(
          result.error_description ?? 'Google token exchange failed',
        );
      }

      return result.access_token;
    } catch (error: unknown) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const message = axios.isAxiosError<GoogleTokenResponse>(error)
        ? error.response?.data?.error_description
        : null;

      throw new BadGatewayException(message ?? 'Google token exchange failed', {
        cause: error,
      });
    }
  }

  private async getGoogleProfile(accessToken: string): Promise<GoogleProfile> {
    let result: GoogleUserInfoResponse;

    try {
      result = await this.httpService.get<GoogleUserInfoResponse>(
        this.getRequiredConfig('GOOGLE_USER_INFO_URL'),
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch (error: unknown) {
      throw new BadGatewayException('Unable to retrieve Google profile', {
        cause: error,
      });
    }

    if (!result.sub || !result.email) {
      throw new BadGatewayException('Unable to retrieve Google profile');
    }

    return {
      sub: result.sub,
      email: result.email,
      emailVerified: result.email_verified === true,
      name: result.name ?? null,
      picture: result.picture ?? null,
    };
  }

  private getCookie(
    cookieHeader: string | undefined,
    name: string,
  ): string | null {
    const cookies = cookieHeader?.split(';') ?? [];
    const cookie = cookies.find((value) => value.trim().startsWith(`${name}=`));

    return cookie
      ? decodeURIComponent(cookie.trim().slice(name.length + 1))
      : null;
  }

  private getStateTtl(): string {
    return this.configService.get<string>('GOOGLE_OAUTH_STATE_TTL', '10m');
  }

  private getStateTtlMilliseconds(): number {
    return parseDurationToMilliseconds(
      this.getStateTtl(),
      'GOOGLE_OAUTH_STATE_TTL',
    );
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`${key} is not configured`);
    }

    return value;
  }
}
