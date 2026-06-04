import { env } from "../../env";
import type { EmailDriver, SendEmailOptions } from "./types";
import { ConsoleEmailDriver } from "./drivers/console.driver";
import { BrevoEmailDriver } from "./drivers/brevo.driver";

class EmailService implements EmailDriver {
  private activeDriverName: string;
  private drivers = new Map<string, EmailDriver>();

  constructor() {
    // 1. Register default drivers
    this.register("console", new ConsoleEmailDriver());

    // Initialize and register Brevo if credentials are provided or if it's the selected driver
    if (env.EMAIL_DRIVER === "brevo" || (env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL)) {
      const apiKey = env.BREVO_API_KEY;
      const senderEmail = env.BREVO_SENDER_EMAIL;

      if (env.EMAIL_DRIVER === "brevo") {
        if (!apiKey || !senderEmail) {
          throw new Error(
            "BREVO_API_KEY and BREVO_SENDER_EMAIL must be set in your environment to use the 'brevo' email driver."
          );
        }
      }

      if (apiKey && senderEmail) {
        this.register(
          "brevo",
          new BrevoEmailDriver({
            apiKey,
            senderEmail,
            senderName: env.BREVO_SENDER_NAME,
          })
        );
      }
    }

    // 2. Set active driver from env, fallback to console if not found
    this.activeDriverName = env.EMAIL_DRIVER;
    if (!this.drivers.has(this.activeDriverName)) {
      console.warn(
        `[EmailService] Configured driver "${this.activeDriverName}" is not registered. Falling back to "console" driver.`
      );
      this.activeDriverName = "console";
    }
  }

  /**
   * Register a new email driver adapter.
   */
  register(name: string, driver: EmailDriver): void {
    this.drivers.set(name, driver);
  }

  /**
   * Switch the currently active driver.
   */
  use(name: string): void {
    if (!this.drivers.has(name)) {
      throw new Error(`[EmailService] Email driver "${name}" is not registered.`);
    }
    this.activeDriverName = name;
  }

  /**
   * Get the current active driver name.
   */
  getActiveDriverName(): string {
    return this.activeDriverName;
  }

  /**
   * Get a registered driver instance by name.
   */
  getDriver(name: string): EmailDriver | undefined {
    return this.drivers.get(name);
  }

  /**
   * Send email using the active driver.
   */
  async send(options: SendEmailOptions): Promise<void> {
    const driver = this.drivers.get(this.activeDriverName);
    if (!driver) {
      throw new Error(`[EmailService] No active email driver set.`);
    }

    try {
      await driver.send(options);
    } catch (error) {
      console.error(
        `[EmailService] Failed to send email via "${this.activeDriverName}" to "${options.to}":`,
        error
      );
      throw error;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
