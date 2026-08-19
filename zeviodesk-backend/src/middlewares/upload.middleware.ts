import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

export function uploadMiddleware(req: Request, res: Response, next: NextFunction) {
  logger.info(`📁 [UploadMiddleware] Mock file upload stream processed for ${req.path}`);
  next();
}
