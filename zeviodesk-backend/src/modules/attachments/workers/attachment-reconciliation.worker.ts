import { AttachmentStatus, AttachmentAuditAction } from "@prisma/client";
import { prisma } from "../../../config/prisma.js";
import { s3StorageProvider } from "../storage/s3-storage.provider";

export async function runAttachmentReconciliationJob(): Promise<{
  promotionsRecovered: number;
  missingDetected: number;
}> {
  let promotionsRecovered = 0;
  let missingDetected = 0;

  // 1. Find stuck VERIFYING attachments
  const stuckVerifying = await prisma.attachment.findMany({
    where: {
      status: AttachmentStatus.VERIFYING,
      updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) }, // Stuck for > 5 mins
    },
    take: 50,
  });

  for (const att of stuckVerifying) {
    try {
      const permanentKey = `tenants/${att.tenantId}/${att.entityType}/${att.entityId}/attachments/${att.id}/original`;
      const exists = await s3StorageProvider.objectExists(permanentKey);

      if (exists) {
        // Promotion succeeded but DB update failed -> Recover to READY
        await prisma.attachment.update({
          where: { id: att.id },
          data: {
            storageKey: permanentKey,
            status: AttachmentStatus.READY,
            verifiedAt: new Date(),
          },
        });
        promotionsRecovered++;
      } else {
        // Permanent object missing -> Check quarantine
        const quarantineKey = `quarantine/${att.tenantId}/${att.id}/original`;
        const quarantineExists = await s3StorageProvider.objectExists(quarantineKey);

        if (quarantineExists) {
          // Retry promotion copy
          await s3StorageProvider.copyObject(quarantineKey, permanentKey);
          await prisma.attachment.update({
            where: { id: att.id },
            data: {
              storageKey: permanentKey,
              status: AttachmentStatus.READY,
              verifiedAt: new Date(),
            },
          });
          s3StorageProvider.deleteObject(quarantineKey).catch(() => {});
          promotionsRecovered++;
        } else {
          // Neither exists -> FAILED
          await prisma.attachment.update({
            where: { id: att.id },
            data: { status: AttachmentStatus.FAILED },
          });
        }
      }
    } catch (err) {
      console.error(`[AttachmentReconciliation] Error recovering attachment ${att.id}:`, err);
    }
  }

  // 2. Sample READY attachments for missing S3 binaries
  const readySample = await prisma.attachment.findMany({
    where: {
      status: AttachmentStatus.READY,
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  for (const att of readySample) {
    try {
      const exists = await s3StorageProvider.objectExists(att.storageKey);
      if (!exists) {
        // Flag as STORAGE_MISSING and record audit log
        await prisma.$transaction([
          prisma.attachment.update({
            where: { id: att.id },
            data: { status: AttachmentStatus.STORAGE_MISSING },
          }),
          prisma.attachmentAudit.create({
            data: {
              tenantId: att.tenantId,
              attachmentId: att.id,
              action: AttachmentAuditAction.STORAGE_MISSING,
              metadata: { storageKey: att.storageKey },
            },
          }),
        ]);
        missingDetected++;
      }
    } catch (err) {
      console.error(`[AttachmentReconciliation] Error checking READY attachment ${att.id}:`, err);
    }
  }

  return { promotionsRecovered, missingDetected };
}
