import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../config/constants.js";

// ⚠️ In-memory rate limiter — ONLY safe with a single server instance.
// If this app is ever scaled horizontally, this MUST move to Redis first,
// or rate limits become effectively N × limit (see rate-limit-redis).
const rateMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every minute to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap.entries()) {
    if (now > entry.resetAt) {
      rateMap.delete(ip);
    }
  }
}, 60000);

export function rateLimitMiddleware(limit = 100, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || "127.0.0.1";
    const now = Date.now();
    const entry = rateMap.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + windowMs;
    } else {
      entry.count += 1;
    }

    rateMap.set(ip, entry);

    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return sendError(res, "Too many requests. Please try again later.", 429);
    }

    next();
  };
}
