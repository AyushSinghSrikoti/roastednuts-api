import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

import type { SendEmailInput } from '@/common/interfaces/mail.interface';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async send(input: SendEmailInput): Promise<void> {
    await this.getTransporter().sendMail({
      from: this.getRequiredConfig('SMTP_FROM'),
      ...input,
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const port = Number(this.getRequiredConfig('SMTP_PORT'));
    this.transporter = nodemailer.createTransport({
      host: this.getRequiredConfig('SMTP_HOST'),
      port,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.getRequiredConfig('SMTP_USER'),
        pass: this.getRequiredConfig('SMTP_PASSWORD'),
      },
    });

    return this.transporter;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new Error(`${key} is not configured`);
    }

    return value;
  }
}
