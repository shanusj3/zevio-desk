import { randomBytes } from "crypto";
import { prisma } from "../config/prisma.js";

/** Crockford-style alphabet (no 0/O, 1/I/L confusion). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const JOB_NUMBER_LENGTH = 8;

function randomJobSegment(length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return result;
}

/** Globally unique random public reference; scoped per tenant in the database. */
export async function generateJobNumber(tenantId: string): Promise<string> {
  const maxAttempts = 12;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const jobNumber = randomJobSegment(JOB_NUMBER_LENGTH);
    const existing = await prisma.ticket.findFirst({
      where: { tenantId, jobNumber },
      select: { id: true },
    });
    if (!existing) return jobNumber;
  }

  throw new Error("Failed to generate a unique ticket reference");
}
