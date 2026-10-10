import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
  logError(error: unknown, context?: string): void {
    console.error(context ? `[${context}]` : '[Application]', error);
  }

  logImportantError(error: unknown, context?: string): void {
    if (error instanceof HttpException && error.getStatus() < 500) {
      return;
    }

    this.logError(error, context);
  }
}
