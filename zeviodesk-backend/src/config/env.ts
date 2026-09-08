import dotenv from "dotenv";
import crypto from "crypto";
import { logger } from "./logger.js";

dotenv.config();

function getSecret(key: string, minLength = 32): string {
  const value = process.env[key];

  if (value && value.length >= minLength) {
    return value;
  }

  if (value && value.length < minLength) {
    throw new Error(`[ENV] ${key} must be at least ${minLength} characters`);
  }

  if (process.env.NODE_ENV !== "development") {
    throw new Error(`[ENV] ${key} is required and must be set`);
  }

  // Ephemeral, random per-process — never a fixed, guessable string
  const devSecret = crypto.randomBytes(32).toString("hex");
  logger.warn(`[ENV] WARNING: generated ephemeral ${key} for local dev — not persisted`);
  return devSecret;
}

export const env = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: getSecret("JWT_SECRET"),

  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  MASTER_WABA_ID: process.env.MASTER_WABA_ID,
  META_SYSTEM_TOKEN: process.env.META_SYSTEM_TOKEN,

  ENCRYPTION_KEY: getSecret("ENCRYPTION_KEY"),
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  META_APP_SECRET: process.env.META_APP_SECRET || "zevio_meta_app_secret",
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || "zevio_verify_token",
  META_APP_ID: process.env.META_APP_ID || "dev_meta_app_id",
  META_CONFIG_ID: process.env.META_CONFIG_ID || "dev_meta_config_id",
};
