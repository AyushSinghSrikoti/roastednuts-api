import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { LoggerService } from '@/common/services/logger.service';
import { HttpService } from '@/common/services/http.service';
import { MailService } from '@/common/services/mail.service';
import { AdminAuthController } from '@/domains/auth/admin-auth.controller';
import { AuthSessionsRepository } from '@/domains/auth/auth-sessions.repository';
import { AuthController } from '@/domains/auth/auth.controller';
import { AuthSession } from '@/domains/auth/entities/auth-session.entity';
import { OAuthLoginCode } from '@/domains/auth/entities/oauth-login-code.entity';
import { PasswordResetToken } from '@/domains/auth/entities/password-reset-token.entity';
import { AccessTokenGuard } from '@/domains/auth/guards/access-token.guard';
import { AuthService } from '@/domains/auth/auth.service';
import { GoogleOAuthService } from '@/domains/auth/google-oauth.service';
import { LoginController } from '@/domains/auth/login.controller';
import { ProfileController } from '@/domains/auth/profile.controller';
import { OAuthLoginCodesRepository } from '@/domains/auth/oauth-login-codes.repository';
import { PasswordResetTokensRepository } from '@/domains/auth/password-reset-tokens.repository';
import { UsersModule } from '@/domains/users/users.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    TypeOrmModule.forFeature([AuthSession, OAuthLoginCode, PasswordResetToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'ACCESS_TOKEN_TTL',
            '1d',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    AdminAuthController,
    LoginController,
    ProfileController,
  ],
  providers: [
    AuthService,
    GoogleOAuthService,
    AuthSessionsRepository,
    OAuthLoginCodesRepository,
    PasswordResetTokensRepository,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    LoggerService,
    HttpService,
    MailService,
  ],
})
export class AuthModule {}
