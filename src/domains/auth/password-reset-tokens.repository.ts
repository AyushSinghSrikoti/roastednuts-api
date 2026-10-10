import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';

import { PasswordResetToken } from '@/domains/auth/entities/password-reset-token.entity';

@Injectable()
export class PasswordResetTokensRepository {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly repository: Repository<PasswordResetToken>,
  ) {}

  async revokeActiveForUser(userId: string): Promise<void> {
    await this.repository.update(
      { userId, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
  }

  create(userId: string, tokenHash: string, expiresAt: Date) {
    return this.repository.save(
      this.repository.create({
        userId,
        tokenHash,
        expiresAt,
        consumedAt: null,
      }),
    );
  }

  findActiveForUpdate(tokenHash: string, manager: EntityManager) {
    return manager.getRepository(PasswordResetToken).findOne({
      where: {
        tokenHash,
        expiresAt: MoreThan(new Date()),
        consumedAt: IsNull(),
      },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async consume(id: string, manager: EntityManager): Promise<void> {
    await manager.getRepository(PasswordResetToken).update(id, {
      consumedAt: new Date(),
    });
  }
}
