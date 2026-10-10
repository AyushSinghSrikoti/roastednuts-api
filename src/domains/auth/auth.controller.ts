import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Public } from '@/common/decorators/public.decorator';
import { LoggerService } from '@/common/services/logger.service';
import { AuthService } from '@/domains/auth/auth.service';
import { GOOGLE_OAUTH } from '@/domains/auth/constants/google-oauth.constants';
import { GoogleOAuthService } from '@/domains/auth/google-oauth.service';
import { SignupDto } from '@/domains/auth/dto/signup.dto';
import { ForgotPasswordDto } from '@/domains/auth/dto/forgot-password.dto';
import { GoogleCodeExchangeDto } from '@/domains/auth/dto/google-code-exchange.dto';
import { ResetPasswordDto } from '@/domains/auth/dto/reset-password.dto';
import { RefreshTokenDto } from '@/domains/auth/dto/refresh-token.dto';
import type { RefreshResponse, SignupResponse } from '@/domains/auth/types';
import type { ApiResponse } from '@/types/api';

@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get('google')
  google(@Res() response: Response): void {
    try {
      const request = this.googleOAuthService.createAuthorizationRequest();

      response.cookie(GOOGLE_OAUTH.STATE_COOKIE_NAME, request.state, {
        httpOnly: true,
        secure: request.secureCookie,
        sameSite: 'lax',
        maxAge: request.stateMaxAge,
        path: GOOGLE_OAUTH.STATE_COOKIE_PATH,
      });
      response.redirect(request.authorizationUrl);
    } catch (error: unknown) {
      this.loggerService.logImportantError(error, 'GoogleOAuthStart');
      throw error;
    }
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const loginCode = await this.googleOAuthService.handleCallback({
        code,
        state,
        oauthError,
        cookieHeader: request.headers.cookie,
      });
      const successUrl = this.googleOAuthService.getSuccessRedirectUrl();
      const fragment = new URLSearchParams({
        code: loginCode,
      });

      response.clearCookie(GOOGLE_OAUTH.STATE_COOKIE_NAME, {
        path: GOOGLE_OAUTH.STATE_COOKIE_PATH,
      });
      response.redirect(`${successUrl}#${fragment.toString()}`);
    } catch (error: unknown) {
      this.loggerService.logError(error, 'GoogleOAuthCallback');
      response.clearCookie(GOOGLE_OAUTH.STATE_COOKIE_NAME, {
        path: GOOGLE_OAUTH.STATE_COOKIE_PATH,
      });
      const redirectUrl = new URL(
        this.googleOAuthService.getFailureRedirectUrl(),
      );
      redirectUrl.searchParams.set('error', 'google_auth_failed');
      response.redirect(redirectUrl.toString());
    }
  }

  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  async exchangeGoogleCode(
    @Body() dto: GoogleCodeExchangeDto,
  ): Promise<ApiResponse<SignupResponse>> {
    return {
      data: await this.googleOAuthService.exchangeLoginCode(dto.code),
      message: 'Google login successful',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ApiResponse<{ resetToken?: string }>> {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<ApiResponse<null>> {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('signup')
  signup(@Body() signupDto: SignupDto): Promise<ApiResponse<SignupResponse>> {
    return this.authService.signup(signupDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto): Promise<ApiResponse<null>> {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<ApiResponse<RefreshResponse>> {
    return this.authService.refresh(dto.refreshToken);
  }
}
