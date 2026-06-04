import type { EmailDriver, SendEmailOptions } from "../types";

export class ConsoleEmailDriver implements EmailDriver {
  async send(options: SendEmailOptions): Promise<void> {
    console.log("=========================================");
    console.log(`[CONSOLE EMAIL] Sending Email:`);
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    if (options.text) {
      console.log(`Text:    ${options.text}`);
    }
    console.log(`HTML:    ${options.html}`);
    console.log("=========================================");
  }
}
