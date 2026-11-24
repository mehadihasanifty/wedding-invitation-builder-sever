import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { Resend } from "resend";
import { env, passwordRecoveryEnabled } from "../../config/env.js";

type AuthDatabaseAdapter = NonNullable<BetterAuthOptions["database"]>;

export function createAuth(database: AuthDatabaseAdapter) {
 const resend = passwordRecoveryEnabled && env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : undefined;
 return betterAuth({
  appName: "Everafter",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database,
  trustedOrigins: [env.CLIENT_ORIGIN],
  emailAndPassword: {
   enabled: true,
   requireEmailVerification: false,
   ...(resend && env.EMAIL_FROM ? {
    sendResetPassword: async ({ user, url }) => {
     const result = await resend.emails.send({
      from: env.EMAIL_FROM!,
      to: user.email,
      subject: "Reset your Everafter password",
      text: `Use this secure link to reset your password: ${url}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Use this secure link to reset your password:</p><p><a href="${url}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
     });
     if (result.error) throw new Error("Password reset email could not be sent.");
    },
   } : {}),
  },
  user: { changeEmail: { enabled: false } },
  advanced: {
   useSecureCookies: env.NODE_ENV === "production",
   defaultCookieAttributes: {
    sameSite: "lax",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
   },
  },
 });
}

export type AuthInstance = ReturnType<typeof createAuth>;
export type AuthSession = NonNullable<Awaited<ReturnType<AuthInstance["api"]["getSession"]>>>;
