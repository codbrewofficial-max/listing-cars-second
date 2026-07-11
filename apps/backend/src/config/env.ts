import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_BASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("*"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  // PENTING: jangan pakai z.coerce.boolean() di sini — Boolean("false") === true di JS,
  // jadi string "false" dari .env akan ke-coerce jadi true. Parse manual sebagai berikut:
  PGSSL: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v.trim().toLowerCase() === "true"),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().default(30),

  JWT_EMAIL_SECRET: z.string().min(10),
  JWT_EMAIL_VERIFICATION_EXPIRES_IN: z.string().default("24h"),
  JWT_RESET_PASSWORD_EXPIRES_IN: z.string().default("1h"),

  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET_NAME: z.string().default("lcs-media"),
  R2_PUBLIC_BASE_URL: z.string().optional().default(""),
  R2_ENDPOINT: z.string().optional().default(""),

  MEDIA_LIBRARY_QUOTA_BYTES: z.coerce.number().default(1024 * 1024 * 1024),

  BREVO_API_KEY: z.string().optional().default(""),
  BREVO_SENDER_EMAIL: z.string().optional().default("no-reply@example.com"),
  BREVO_SENDER_NAME: z.string().optional().default("LCS Platform"),

  SEED_SUPERADMIN_NAME: z.string().optional(),
  SEED_SUPERADMIN_EMAIL: z.string().optional(),
  SEED_SUPERADMIN_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Environment variable tidak valid:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
