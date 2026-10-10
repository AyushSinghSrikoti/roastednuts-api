import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';

import { OAuthLoginCode } from '@/domains/auth/entities/oauth-login-code.entity';
import type { GoogleProfile } from '@/domains/auth/types';

@Injectable()
export class OAuthLoginCodesRepository {
  constructor(
    @InjectRepository(OAuthLoginCode)
    private readonly repository: Repository<OAuthLoginCode>,
  ) {}

  create(codeHash: string, profile: GoogleProfile, expiresAt: Date) {
    return this.repository.save(
      this.repository.create({
        codeHash,
        profile,
        expiresAt,
        consumedAt: null,
      }),
    );
  }

  findActiveForUpdate(codeHash: string, manager: EntityManager) {
    return manager.getRepository(OAuthLoginCode).findOne({
      where: {
        codeHash,
        expiresAt: MoreThan(new Date()),
        consumedAt: IsNull(),
      },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async consume(id: string, manager: EntityManager): Promise<void> {
    await manager.getRepository(OAuthLoginCode).update(id, {
      consumedAt: new Date(),
    });
  }
}
