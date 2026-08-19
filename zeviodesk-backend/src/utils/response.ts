import { Response } from "express";
import { ApiResponse } from "../interfaces/response.interface.js";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Operation successful",
  statusCode = 200,
  meta?: any
) {
  const payload: any = {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message = "An error occurred",
  statusCode = 500,
  errorCode = "INTERNAL_ERROR",
  errorDetail?: any
) {
  let safeMessage = message;
  if (typeof message === "string" && (message.includes("prisma") || message.includes("PrismaClient") || message.includes("\n"))) {
    safeMessage = "An unexpected error occurred.";
  }

  const payload: any = {
    success: false,
    errorCode,
    message: safeMessage,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== "production" && (errorDetail || message !== safeMessage)) {
    payload.error = errorDetail || message;
  }

  return res.status(statusCode).json(payload);
}
