import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/domains/users/entities/user.entity';
import { UsersRepository } from '@/domains/users/users.repository';
import { UsersService } from '@/domains/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
