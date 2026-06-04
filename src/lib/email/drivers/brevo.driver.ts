import { BrevoClient } from "@getbrevo/brevo";
import type { EmailDriver, SendEmailOptions } from "../types";

export interface BrevoDriverConfig {
  apiKey: string;
  senderEmail: string;
  senderName?: string;
}

export class BrevoEmailDriver implements EmailDriver {
  private client: BrevoClient;
  private sender: { name?: string; email: string };

  constructor(config: BrevoDriverConfig) {
    if (!config.apiKey) {
      throw new Error("BREVO_API_KEY is required for Brevo email driver");
    }
    if (!config.senderEmail) {
      throw new Error("BREVO_SENDER_EMAIL is required for Brevo email driver");
    }
    this.client = new BrevoClient({ apiKey: config.apiKey });
    this.sender = {
      name: config.senderName,
      email: config.senderEmail,
    };
  }

  async send(options: SendEmailOptions): Promise<void> {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        sender: this.sender,
        to: [{ email: options.to }],
      });
    } catch (error) {
      console.error("[BrevoEmailDriver] Error sending email:", error);
      throw error;
    }
  }
}
