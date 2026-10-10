export interface EmailAttachment {
  filename: string;
  path: string;
  cid: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}
