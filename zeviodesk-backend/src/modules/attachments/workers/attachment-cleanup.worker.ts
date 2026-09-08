import { AttachmentStatus, UploadSessionStatus } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import { s3StorageProvider } from "../storage/s3-storage.provider";

export async function runAttachmentCleanupJob(): Promise<{
  expiredSessionsCleaned: number;
  quarantineCleaned: number;
}> {
  const now = new Date();

  // 1. Find expired upload sessions
  const expiredSessions = await prisma.uploadSession.findMany({
    where: {
      status: UploadSessionStatus.INITIATED,
      expiresAt: { lt: now },
    },
    include: { attachment: true },
    take: 50,
  });

  let expiredCount = 0;
  let quarantineCount = 0;

  for (const session of expiredSessions) {
    try {
      // Mark session expired
      await prisma.uploadSession.update({
        where: { id: session.id },
        data: { status: UploadSessionStatus.EXPIRED },
      });

      // Mark attachment expired if still INITIATED or UPLOADING
      if (
        session.attachment.status === AttachmentStatus.INITIATED ||
        session.attachment.status === AttachmentStatus.UPLOADING
      ) {
        await prisma.attachment.update({
          where: { id: session.attachmentId },
          data: { status: AttachmentStatus.EXPIRED },
        });
      }

      // Delete S3 quarantine object if exists
      if (session.storageKey.startsWith("quarantine/")) {
        await s3StorageProvider.deleteObject(session.storageKey);
        quarantineCount++;
      }
      expiredCount++;
    } catch (err) {
      console.error(`[AttachmentCleanupJob] Error cleaning session ${session.id}:`, err);
    }
  }

  return {
    expiredSessionsCleaned: expiredCount,
    quarantineCleaned: quarantineCount,
  };
}
