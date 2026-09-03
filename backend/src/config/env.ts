import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.string().min(1, "REDIS_URL gerekli"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL gerekli"),
  DAILY_FREE_SEARCHES: z.coerce.number().int().positive().default(3),
  CORS_ORIGIN: z.string().default("*"),
  ADMOB_SSV_PUBLIC_KEYS_URL: z
    .string()
    .default("https://gstatic.com/admob/reward/verifier-keys.json"),
  ADMOB_SSV_ALLOWED_AD_UNIT_IDS: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  GOOGLE_CLOUD_PROJECT_NUMBER: z.string().default(""),
  PLAY_INTEGRITY_SERVICE_ACCOUNT_JSON_PATH: z.string().default(""),
  APPLE_TEAM_ID: z.string().default(""),
  APPLE_APP_ATTEST_ENV: z.enum(["development", "production"]).default("production"),

  // Android paket adı (Play Integrity token doğrulaması bu paket için yapılır)
  ANDROID_PACKAGE_NAME: z.string().default("com.enes.instagramaccountviews"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Ortam değişkenleri geçersiz:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
