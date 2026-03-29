import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from 'src/domains/auth/auth.service';
import { SignUpDto } from 'src/domains/auth/dto/sign-up.dto';
import { errorHandler } from 'src/global/helpers/error.handler';
import { X_API_RESPONSE_TYPE, X_API_SUCCESS_RESPONSE_TYPE } from 'src/global/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get()
  getHello(): string {
    return this.authService.getHelloMessage();
  }

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto): Promise<X_API_RESPONSE_TYPE> {
    try {

      const response: X_API_RESPONSE_TYPE = await this.authService.signUp(signUpDto);

      return response;
    } catch (error: unknown) {
      return errorHandler(error);
    }

  }
}
