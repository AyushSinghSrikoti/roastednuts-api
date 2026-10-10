import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { User } from '@/domains/users/entities/user.entity';
import {
  CreateGoogleUserInput,
  CreatePasswordUserInput,
} from '@/domains/users/types';
import { UsersRepository } from '@/domains/users/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.usersRepository.findByEmail(
      this.normalizeEmail(email),
      manager,
    );
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmailWithPassword(
      this.normalizeEmail(email),
    );
  }

  async findByGoogleSubject(
    googleSubject: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.usersRepository.findByGoogleSubject(googleSubject, manager);
  }

  async createGoogleUser(
    input: CreateGoogleUserInput,
    manager?: EntityManager,
  ): Promise<User> {
    return this.usersRepository.createAndSave(
      {
        email: this.normalizeEmail(input.email),
        googleSubject: input.googleSubject,
        name: input.name ?? null,
        avatarUrl: input.avatarUrl ?? null,
      },
      manager,
    );
  }

  async createPasswordUser(input: CreatePasswordUserInput): Promise<User> {
    return this.usersRepository.createAndSave({
      email: this.normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      name: input.name ?? null,
    });
  }

  async updateLastLogin(id: string, manager?: EntityManager): Promise<void> {
    await this.usersRepository.updateLastLogin(id, new Date(), manager);
  }

  async linkGoogleIdentity(
    id: string,
    googleSubject: string,
    name: string | null,
    avatarUrl: string | null,
    manager?: EntityManager,
  ): Promise<void> {
    await this.usersRepository.linkGoogleIdentity(
      id,
      googleSubject,
      name,
      avatarUrl,
      manager,
    );
  }

  async updatePassword(
    id: string,
    passwordHash: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.usersRepository.updatePassword(id, passwordHash, manager);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
