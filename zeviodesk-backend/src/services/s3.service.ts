import { logger } from "../config/logger.js";

export const s3Service = {
  uploadFile: async (fileName: string, buffer: Buffer, mimeType: string): Promise<string> => {
    const fileKey = `uploads/${Date.now()}-${fileName}`;
    logger.info(`☁️ [S3Service] Would upload file: ${fileKey} (not configured)`);
    return `/uploads/${fileName}`;
  },

  deleteFile: async (fileKey: string): Promise<boolean> => {
    logger.info(`☁️ [S3Service] Would delete file from S3: ${fileKey}`);
    return true;
  },
};
