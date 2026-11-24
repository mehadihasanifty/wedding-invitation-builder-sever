import "dotenv/config";
import { z } from "zod";
const schema = z.object({
 NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
 PORT: z.coerce.number().int().min(1).max(65535).default(5000),
 MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required."),
 CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
 BETTER_AUTH_URL: z.string().url().default("http://localhost:5000"),
 BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters."),
 RESEND_API_KEY: z.string().trim().min(1).optional(),
 EMAIL_FROM: z.string().trim().email().optional(),
});
const result = schema.safeParse(process.env);
if (!result.success) {
 console.error("Invalid server environment configuration:");
 for (const issue of result.error.issues) console.error(`- ${issue.path.join(".")}: ${issue.message}`);
 process.exit(1);
}
export const env = result.data;
export const passwordRecoveryEnabled = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
