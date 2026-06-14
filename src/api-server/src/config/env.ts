import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const required = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

const missing = required.filter(
  (k) => !process.env[k] || process.env[k]!.trim().length === 0,
);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60 * 1000), // 1 minute window
  RATE_LIMIT_MAX: z.coerce.number().default(500),
});

if (missing.length) {
  // Fail fast with a render-friendly message.
  throw new Error(
    [
      "Missing required environment variables.",
      "Set these in Render's Environment settings:",
      ...missing.map((k) => `- ${k}`),
    ].join("\n"),
  );
}

export const env = envSchema.parse(process.env);
