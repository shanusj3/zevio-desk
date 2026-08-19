import crypto from "crypto";

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T, keysToRemove: string[]): Partial<T> {
  const result = { ...obj };
  for (const key of keysToRemove) {
    delete result[key];
  }
  return result;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
