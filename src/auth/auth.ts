import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, bearer, openAPI } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { env } from "../env";
import { emailService } from "../lib/email";
import { getResetPasswordEmailTemplate } from "../lib/email/templates/reset-password.template";
import { getVerificationEmailTemplate } from "../lib/email/templates/verification.template";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // ── Email & Password ──────────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const { html, text } = getResetPasswordEmailTemplate(user.name, url);
      await emailService.send({
        to: user.email,
        subject: "Reset Your Password - Restoko",
        html,
        text,
      });
    },
  },

  // ── Email Verification ────────────────────────────────────────────────────
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const { html, text } = getVerificationEmailTemplate(user.name, url);
      await emailService.send({
        to: user.email,
        subject: "Verify Your Email Address - Restoko",
        html,
        text,
      });
    },
    sendOnSignUp: true,
  },

  // ── Social OAuth Providers ────────────────────────────────────────────────
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 10,
      },
    }),
    bearer(), // Enables Authorization: Bearer <session-token> auth
    ...(env.NODE_ENV === "development" ? [openAPI()] : []),
  ],

  // ── Advanced ──────────────────────────────────────────────────────────────
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
});

// Export inferred types for use across the app
export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSessionData = typeof auth.$Infer.Session.session;
