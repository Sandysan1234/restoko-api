export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailDriver {
  send(options: SendEmailOptions): Promise<void>;
}
