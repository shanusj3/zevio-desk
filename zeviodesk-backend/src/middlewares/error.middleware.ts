import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";
import { AppError } from "../errors/AppError.js";
import { Prisma } from "@prisma/client";

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  // Known, safe-to-expose operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message, status: err.statusCode });
  }

  // Prisma errors — map to safe messages, never leak query/schema details
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error("Database error", { code: err.code, meta: err.meta, stack: err.stack });
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A record with this value already exists.", status: 409 });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found.", status: 404 });
    }
    return res.status(500).json({ error: "A database error occurred.", status: 500 });
  }

  // Everything else — AWS SDK, Nodemailer, crypto, unexpected bugs
  logger.error("Unhandled error", { message: err.message, stack: err.stack, path: req.path });
  return res.status(500).json({ error: "An unexpected error occurred.", status: 500 });
}
