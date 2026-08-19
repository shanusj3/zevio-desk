import crypto from "crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export const encryptionUtils = {
  encrypt: (text: string): string => {
    if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length !== 64) {
      throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
    }
    
    const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  },

  decrypt: (encryptedText: string): string => {
    if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length !== 64) {
      throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
    }
    
    const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
    const parts = encryptedText.split(":");
    
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  },
};
