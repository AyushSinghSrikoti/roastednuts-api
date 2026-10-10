import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';

import { AuthSession } from '@/domains/auth/entities/auth-session.entity';

@Injectable()
export class AuthSessionsRepository {
  constructor(
    @InjectRepository(AuthSession)
    private readonly repository: Repository<AuthSession>,
  ) {}

  create(
    userId: string,
    refreshTokenHash: string,
    expiresAt: Date,
    manager?: EntityManager,
  ) {
    const repository = manager?.getRepository(AuthSession) ?? this.repository;
    return repository.save(
      repository.create({
        userId,
        refreshTokenHash,
        expiresAt,
        revokedAt: null,
      }),
    );
  }

  findActiveByRefreshTokenHash(refreshTokenHash: string) {
    return this.repository.findOne({
      where: {
        refreshTokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  findActiveById(id: string) {
    return this.repository.findOne({
      where: {
        id,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async rotate(id: string, refreshTokenHash: string, expiresAt: Date) {
    await this.repository.update(id, { refreshTokenHash, expiresAt });
  }

  async revoke(id: string) {
    await this.repository.update(id, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string, manager: EntityManager) {
    await manager
      .getRepository(AuthSession)
      .update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
