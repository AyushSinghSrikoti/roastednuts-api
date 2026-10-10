import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';

import { User } from '@/domains/users/entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findByEmail(email: string, manager?: EntityManager): Promise<User | null> {
    return (manager?.getRepository(User) ?? this.repository).findOne({
      where: { email },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByGoogleSubject(
    googleSubject: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return (manager?.getRepository(User) ?? this.repository).findOne({
      where: { googleSubject },
    });
  }

  createAndSave(
    input: DeepPartial<User>,
    manager?: EntityManager,
  ): Promise<User> {
    const repository = manager?.getRepository(User) ?? this.repository;
    return repository.save(repository.create(input));
  }

  async updateLastLogin(
    id: string,
    lastLoginAt: Date,
    manager?: EntityManager,
  ): Promise<void> {
    await (manager?.getRepository(User) ?? this.repository).update(id, {
      lastLoginAt,
    });
  }

  async linkGoogleIdentity(
    id: string,
    googleSubject: string,
    name: string | null,
    avatarUrl: string | null,
    manager?: EntityManager,
  ): Promise<void> {
    await (manager?.getRepository(User) ?? this.repository).update(id, {
      googleSubject,
      name,
      avatarUrl,
    });
  }

  async updatePassword(
    id: string,
    passwordHash: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager.getRepository(User).update(id, { passwordHash });
  }
}
