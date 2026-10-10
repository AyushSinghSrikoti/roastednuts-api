import {
  ConflictException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

import { AuthSessionsRepository } from '@/domains/auth/auth-sessions.repository';
import { PasswordResetTokensRepository } from '@/domains/auth/password-reset-tokens.repository';
import { AdminLoginDto } from '@/domains/auth/dto/admin-login.dto';
import { LoginDto } from '@/domains/auth/dto/login.dto';
import { SignupDto } from '@/domains/auth/dto/signup.dto';
import {
  CurrentUserResponse,
  LoginResponse,
  RefreshResponse,
  SignupResponse,
} from '@/domains/auth/types';
import type { AuthenticatedPrincipal } from '@/domains/auth/types/authenticated-principal';
import { User } from '@/domains/users/entities/user.entity';
import { UsersService } from '@/domains/users/users.service';
import { UserStatus } from '@/common/enums/user.enums';
import { parseDurationToMilliseconds } from '@/common/helpers/duration.helper';
import { MailService } from '@/common/services/mail.service';
import { LoggerService } from '@/common/services/logger.service';
import { createPasswordResetEmail } from '@/common/email-templates/password-reset-email';
import { createWelcomeEmail } from '@/common/email-templates/welcome-email';
import { ApiResponse } from '@/types/api';

const scrypt = promisify(scryptCallback);
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionsRepository: AuthSessionsRepository,
    private readonly resetTokensRepository: PasswordResetTokensRepository,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly loggerService: LoggerService,
  ) {}

  adminLogin(loginDto: AdminLoginDto): ApiResponse<LoginResponse> {
    if (
      loginDto.password !== this.configService.get<string>('MASTER_PASSWORD')
    ) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = this.jwtService.sign({
      role: 'admin',
      type: 'admin',
    });

    return {
      data: { token },
      message: 'Login successful',
      statusCode: HttpStatus.OK,
    };
  }

  async login(loginDto: LoginDto): Promise<ApiResponse<SignupResponse>> {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (
      !user?.passwordHash ||
      !(await this.verifyPassword(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active');
    }

    const tokens = await this.createUserSession(user);
    await this.usersService.updateLastLogin(user.id);

    return {
      data: {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login successful',
      statusCode: HttpStatus.OK,
    };
  }

  async signup(signupDto: SignupDto): Promise<ApiResponse<SignupResponse>> {
    const existingUser = await this.usersService.findByEmail(signupDto.email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.hashPassword(signupDto.password);

    try {
      const user = await this.usersService.createPasswordUser({
        email: signupDto.email,
        passwordHash,
      });
      const tokens = await this.createUserSession(user);
      await this.sendWelcomeEmail(user.email);

      return {
        data: {
          ...tokens,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
        message: 'Account created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    const frontendUrl = this.getRequiredConfig('FRONTEND_URL');
    const dashboardUrl = new URL('/dashboard', frontendUrl).toString();
    const logoUrl = new URL('/assets/almond-kernel.png', frontendUrl).toString();

    try {
      await this.mailService.send({
        to: email,
        subject: 'Welcome to Roasted Almonds',
        text: `Dear Customer,\n\nWelcome to Roasted Almonds. Your account has been created successfully, and we're glad to have you with us.\n\nYou can now access your dashboard and start exploring everything Roasted Almonds has to offer.\n\nGo to your dashboard: ${dashboardUrl}\n\nIf you did not create this account, please contact our support team.\n\nThis is an automatically generated email. Please do not reply.\n\n© Roasted Almonds`,
        html: createWelcomeEmail({
          dashboardUrl,
          logoUrl: 'cid:roasted-almonds-welcome-logo',
        }),
        attachments: [
          {
            filename: 'roasted-almonds-logo.png',
            path: logoUrl,
            cid: 'roasted-almonds-welcome-logo',
          },
        ],
      });
    } catch (error: unknown) {
      this.loggerService.logError(error, 'WelcomeEmail');
    }
  }

  async refresh(refreshToken: string): Promise<ApiResponse<RefreshResponse>> {
    const session = await this.sessionsRepository.findActiveByRefreshTokenHash(
      this.hashRefreshToken(refreshToken),
    );

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(session.userId);

    if (!user) {
      await this.sessionsRepository.revoke(session.id);
      throw new UnauthorizedException('User no longer exists');
    }

    const nextRefreshToken = this.generateRefreshToken();
    await this.sessionsRepository.rotate(
      session.id,
      this.hashRefreshToken(nextRefreshToken),
      this.getRefreshTokenExpiry(),
    );

    return {
      data: {
        token: this.signAccessToken(user, session.id),
        refreshToken: nextRefreshToken,
      },
      message: 'Token refreshed successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async getCurrentUser(
    principal: AuthenticatedPrincipal,
  ): Promise<ApiResponse<CurrentUserResponse>> {
    if (principal.type === 'admin') {
      return {
        data: {
          id: null,
          email: null,
          name: 'Administrator',
          avatarUrl: null,
          role: principal.role,
        },
        message: 'Current user retrieved successfully',
        statusCode: HttpStatus.OK,
      };
    }

    const user = principal.sub
      ? await this.usersService.findById(principal.sub)
      : null;

    if (!user || user.status !== UserStatus.ACTIVE) {
      if (principal.sid) {
        await this.sessionsRepository.revoke(principal.sid);
      }
      throw new UnauthorizedException('User session is no longer valid');
    }

    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.name ?? user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      message: 'Current user retrieved successfully',
      statusCode: HttpStatus.OK,
    };
  }

  async logout(refreshToken: string): Promise<ApiResponse<null>> {
    const session = await this.sessionsRepository.findActiveByRefreshTokenHash(
      this.hashRefreshToken(refreshToken),
    );

    if (session) {
      await this.sessionsRepository.revoke(session.id);
    }

    return {
      data: null,
      message: 'Logout successful',
      statusCode: HttpStatus.OK,
    };
  }

  async createUserSession(
    user: User,
    manager?: EntityManager,
  ): Promise<RefreshResponse> {
    const refreshToken = this.generateRefreshToken();
    const session = await this.sessionsRepository.create(
      user.id,
      this.hashRefreshToken(refreshToken),
      this.getRefreshTokenExpiry(),
      manager,
    );

    return {
      token: this.signAccessToken(user, session.id),
      refreshToken,
    };
  }

  async requestPasswordReset(
    email: string,
  ): Promise<ApiResponse<{ resetToken?: string }>> {
    const user = await this.usersService.findByEmailWithPassword(email);
    let resetToken: string | undefined;

    if (user?.passwordHash && user.status === UserStatus.ACTIVE) {
      resetToken = randomBytes(48).toString('base64url');
      await this.resetTokensRepository.revokeActiveForUser(user.id);
      await this.resetTokensRepository.create(
        user.id,
        this.hashOpaqueToken(resetToken),
        new Date(
          Date.now() +
            parseDurationToMilliseconds(
              this.configService.get<string>('PASSWORD_RESET_TTL', '15m'),
              'PASSWORD_RESET_TTL',
            ),
        ),
      );

      if (
        this.configService.get<string>('PASSWORD_RESET_EMAIL_ENABLED') ===
        'true'
      ) {
        const resetUrl = new URL(
          '/reset-password',
          this.getRequiredConfig('FRONTEND_URL'),
        );
        resetUrl.searchParams.set('token', resetToken);
        const logoUrl = new URL(
          '/assets/almond-kernel.png',
          this.getRequiredConfig('FRONTEND_URL'),
        );
        await this.mailService.send({
          to: user.email,
          subject: 'Reset your Roasted Almonds password',
          text: `Use this link to reset your password. It expires shortly and can only be used once:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
          html: createPasswordResetEmail({
            resetUrl: resetUrl.toString(),
            logoUrl: 'cid:roasted-almonds-logo',
          }),
          attachments: [
            {
              filename: 'roasted-almonds-logo.png',
              path: logoUrl.toString(),
              cid: 'roasted-almonds-logo',
            },
          ],
        });
      }
    }

    return {
      data:
        this.configService.get<string>('PASSWORD_RESET_RETURN_TOKEN') === 'true'
          ? { resetToken }
          : {},
      message:
        'If an eligible account exists, password reset instructions have been created',
      statusCode: HttpStatus.OK,
    };
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<ApiResponse<null>> {
    const passwordHash = await this.hashPassword(password);

    await this.dataSource.transaction(async (manager) => {
      const resetToken = await this.resetTokensRepository.findActiveForUpdate(
        this.hashOpaqueToken(token),
        manager,
      );

      if (!resetToken) {
        throw new UnauthorizedException(
          'Invalid or expired password reset token',
        );
      }

      await this.usersService.updatePassword(
        resetToken.userId,
        passwordHash,
        manager,
      );
      await this.sessionsRepository.revokeAllForUser(
        resetToken.userId,
        manager,
      );
      await this.resetTokensRepository.consume(resetToken.id, manager);
    });

    return {
      data: null,
      message: 'Password reset successfully',
      statusCode: HttpStatus.OK,
    };
  }

  private signAccessToken(user: User, sessionId: string): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        sid: sessionId,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      {
        expiresIn: this.configService.get<string>(
          'ACCESS_TOKEN_TTL',
          '1d',
        ) as JwtSignOptions['expiresIn'],
      },
    );
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`${key} is not configured`);
    }

    return value;
  }

  private getRefreshTokenExpiry(): Date {
    const ttl = this.configService.get<string>('REFRESH_TOKEN_TTL', '30d');

    return new Date(
      Date.now() + parseDurationToMilliseconds(ttl, 'REFRESH_TOKEN_TTL'),
    );
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    const [algorithm, salt, storedHash] = passwordHash.split('$');

    if (algorithm !== 'scrypt' || !salt || !storedHash) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedKey = Buffer.from(storedHash, 'hex');

    return (
      derivedKey.length === storedKey.length &&
      timingSafeEqual(derivedKey, storedKey)
    );
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
