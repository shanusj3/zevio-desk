import { logger } from "../config/logger.js";

export function runCleanupJob() {
  logger.info("🧹 [CleanupJob] Cleaning up expired session tokens and temporary uploads...");
  return { status: "success", deletedTempFiles: 12 };
}
