import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple PrismaClient instances in development (hot-reload)
// NOTE: Connection pool limits (connection_limit, pool_timeout) must be configured 
// directly in the DATABASE_URL environment variable to prevent timeout errors under load.
export const prisma = global.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
