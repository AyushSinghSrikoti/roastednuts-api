import { HttpException, HttpStatus, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { X_API_RESPONSE_TYPE } from 'src/global/types';
import { KickboxProvider } from 'src/providers/kickbox/kickbox.provider';
import { EmailVerificationResponse } from 'src/providers/kickbox/kickbox.types';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { AuthProvider } from './enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly kickboxProvider: KickboxProvider,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) { }

  getHelloMessage(): string {
    return 'hello world';
  }

  async signUp(request: SignUpDto): Promise<X_API_RESPONSE_TYPE> {
    try {
      const kickboxResponse = await this.kickboxProvider.get<EmailVerificationResponse>('/verify', { email: request.email });

      if (!kickboxResponse.ok) {
        throw new HttpException('Failed to verify email', HttpStatus.BAD_REQUEST);
      }

      const data = kickboxResponse.data;

      if (
        data.disposable ||
        data.result !== 'deliverable' ||
        data.role
      ) {
        throw new UnprocessableEntityException('Invalid email');
      }

      const existingUser = await this.usersRepository.findOne({
        where: { email: request.email }
      })

      if (existingUser) throw new UnprocessableEntityException("Email already exists")

      const hashedPassword = await bcrypt.hash(request.password, 10);

      const user = this.usersRepository.create({
        name: request.name,
        email: request.email,
        password: hashedPassword,
        provider: AuthProvider.LOCAL
      });

      await this.usersRepository.save(user);

      return {
        status: 201,
        message: 'User created successfully',
        data: {
          id: user.id,
          email: user.email,
        },
      };

    } catch (error) {
      throw new HttpException(
        error.message ?? 'Something went wrong',
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
