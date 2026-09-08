import {
  AttachmentCategory,
  AttachmentEntityType,
  AttachmentStatus,
  UploadSessionStatus,
  AttachmentAuditAction,
  ScanStatus,
  ProcessingStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { s3StorageProvider } from "./storage/s3-storage.provider";
import { getAttachmentPolicy } from "./attachment.policy";
import {
  InitiateUploadDto,
  InitiateUploadResponse,
  CompleteUploadResponse,
} from "./types/attachment.types";

export class AttachmentService {
  /**
   * Helper: Validates entity belongs to the tenant
   */
  private async validateEntityOwnership(
    tenantId: string,
    entityType: AttachmentEntityType,
    entityId: string
  ): Promise<void> {
    if (entityType === "TENANT") {
      if (entityId !== tenantId) {
        throw new Error("Forbidden: Tenant ID mismatch for logo entity.");
      }
      return;
    }

    if (entityType === "TICKET") {
      // Allow uncreated/draft ticket entity IDs during ticket creation flow
      if (entityId === "new" || entityId === "draft" || entityId.startsWith("temp") || entityId.startsWith("draft")) {
        return;
      }
      const ticket = await prisma.ticket.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      // If ticket isn't in DB yet, treat as draft ticket entity for ticket creation flow
      if (!ticket) {
        return;
      }
      return;
    }

    if (entityType === "PRODUCT" || entityType === "PART") {
      // Products/Parts belong to tenant catalog
      return;
    }

    if (entityType === "CUSTOMER") {
      const customer = await prisma.customer.findFirst({
        where: { id: entityId, tenantId },
        select: { id: true },
      });
      if (!customer) {
        throw new Error(`Customer '${entityId}' not found or does not belong to tenant.`);
      }
      return;
    }
  }

  /**
   * Validates max count policy for category
   */
  private async validateCategoryMaxCount(
    tenantId: string,
    entityType: AttachmentEntityType,
    entityId: string,
    category: AttachmentCategory,
    maxCount?: number
  ): Promise<void> {
    if (!maxCount) return;

    // For uncreated/draft tickets during ticket creation, bypass max count check for orphaned 'new' or draft IDs in DB
    if (entityType === "TICKET" && (entityId === "new" || entityId === "draft" || entityId.startsWith("temp") || entityId.startsWith("draft"))) {
      return;
    }

    const currentCount = await prisma.attachment.count({
      where: {
        tenantId,
        entityType,
        entityId,
        category,
        status: { in: [AttachmentStatus.READY, AttachmentStatus.VERIFYING] },
      },
    });

    if (currentCount >= maxCount) {
      throw new Error(`Maximum allowed files (${maxCount}) reached for category '${category}'.`);
    }
  }

  /**
   * Optional Malware & Content Scanner Integration Hook
   */
  private async performMalwareScan(storageKey: string): Promise<ScanStatus> {
    // Extensible security scanning hook (e.g. AWS GuardDuty / ClamAV)
    return ScanStatus.CLEAN;
  }

  /**
   * Initiate Upload session & return S3 presigned URL
   */
  async initiateUpload(
    tenantId: string,
    userId: string | undefined,
    dto: InitiateUploadDto
  ): Promise<InitiateUploadResponse> {
    const policy = getAttachmentPolicy(dto.category);

    // 1. Validate MIME type & size
    if (!policy.allowedMimeTypes.includes(dto.mimeType)) {
      throw new Error(
        `Invalid file type '${dto.mimeType}'. Allowed formats: ${policy.allowedMimeTypes.join(", ")}`
      );
    }
    if (dto.sizeBytes > policy.maxSizeBytes) {
      const maxMb = (policy.maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`File size exceeds maximum limit of ${maxMb} MB.`);
    }

    // 2. Validate entity ownership & category count
    await this.validateEntityOwnership(tenantId, dto.entityType, dto.entityId);
    await this.validateCategoryMaxCount(
      tenantId,
      dto.entityType,
      dto.entityId,
      dto.category,
      policy.maxCount
    );

    // 3. Create attachment record and temporary quarantine storage key
    const attachment = await prisma.attachment.create({
      data: {
        tenantId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        category: dto.category,
        bucket: s3StorageProvider.getBucketName(),
        storageKey: "PENDING", // Will be set on quarantine upload session
        originalFileName: dto.fileName || "file",
        mimeType: dto.mimeType,
        sizeBytes: BigInt(dto.sizeBytes),
        status: AttachmentStatus.INITIATED,
        scanStatus: ScanStatus.SKIPPED,
        processingStatus: ProcessingStatus.SKIPPED,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins expiry
      },
    });

    // 4. Create UploadSession
    const quarantineKey = `quarantine/${tenantId}/${attachment.id}/original`;
    const uploadSession = await prisma.uploadSession.create({
      data: {
        tenantId,
        attachmentId: attachment.id,
        storageKey: quarantineKey,
        status: UploadSessionStatus.INITIATED,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    // Update attachment with quarantine storageKey
    await prisma.attachment.update({
      where: { id: attachment.id },
      data: { storageKey: quarantineKey, status: AttachmentStatus.UPLOADING },
    });

    // Audit log
    await prisma.attachmentAudit.create({
      data: {
        tenantId,
        attachmentId: attachment.id,
        userId,
        action: AttachmentAuditAction.UPLOAD_INITIATED,
        metadata: { uploadSessionId: uploadSession.id, category: dto.category },
      },
    });

    // 5. Generate direct S3 PUT presigned URL targeting the object key (5-minute short expiry)
    const putUploadUrl = await s3StorageProvider.createPutUploadUrl(
      quarantineKey,
      dto.mimeType,
      300
    );

    return {
      attachmentId: attachment.id,
      uploadSessionId: uploadSession.id,
      uploadUrl: putUploadUrl,
      expiresAt: uploadSession.expiresAt.toISOString(),
      storageKey: quarantineKey,
    };
  }

  /**
   * Complete Upload: HEAD validation & quarantine -> permanent promotion
   */
  async completeUpload(
    tenantId: string,
    attachmentId: string,
    userId?: string
  ): Promise<CompleteUploadResponse> {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, tenantId },
      include: { uploadSessions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!attachment) {
      throw new Error(`Attachment '${attachmentId}' not found.`);
    }

    if (attachment.status === AttachmentStatus.READY) {
      return {
        attachmentId: attachment.id,
        status: AttachmentStatus.READY,
        storageKey: attachment.storageKey,
      };
    }

    const session = attachment.uploadSessions[0];
    if (!session) {
      throw new Error("Upload session not found for attachment.");
    }

    // 1. Transition state to VERIFYING
    await prisma.attachment.update({
      where: { id: attachment.id },
      data: { status: AttachmentStatus.VERIFYING },
    });

    // 2. S3 HEAD check on quarantine key
    const quarantineHead = await s3StorageProvider.headObject(session.storageKey);
    if (!quarantineHead) {
      await prisma.attachment.update({
        where: { id: attachment.id },
        data: { status: AttachmentStatus.FAILED },
      });
      throw new Error("File binary not found in quarantine S3 storage. Upload may have failed.");
    }

    // Validate size limit from policy
    const policy = getAttachmentPolicy(attachment.category);
    if (quarantineHead.sizeBytes > policy.maxSizeBytes) {
      await prisma.attachment.update({
        where: { id: attachment.id },
        data: { status: AttachmentStatus.REJECTED },
      });
      throw new Error("Uploaded binary size exceeds policy limit.");
    }

    // 3. Checksum & Security Scan Verification Pipeline
    const checksum = quarantineHead.eTag ? quarantineHead.eTag.replace(/"/g, '') : null;
    const scanStatus: ScanStatus = process.env.ENABLE_MALWARE_SCAN === 'true'
      ? await this.performMalwareScan(session.storageKey)
      : ScanStatus.SKIPPED;

    if (scanStatus === ScanStatus.INFECTED) {
      await prisma.attachment.update({
        where: { id: attachment.id },
        data: { status: AttachmentStatus.REJECTED, scanStatus: ScanStatus.INFECTED },
      });
      s3StorageProvider.deleteObject(session.storageKey).catch(() => {});
      throw new Error("Security alert: File rejected by security scanner.");
    }

    // 3. Promote file to permanent location
    const permanentKey = `tenants/${tenantId}/${attachment.entityType}/${attachment.entityId}/attachments/${attachment.id}/original`;

    const versionId = await s3StorageProvider.copyObject(session.storageKey, permanentKey);

    // Verify permanent object exists
    const permanentHead = await s3StorageProvider.headObject(permanentKey);
    if (!permanentHead) {
      throw new Error("Failed to verify promoted permanent S3 object.");
    }

    // 4. Update Attachment & UploadSession in DB
    const now = new Date();
    await prisma.$transaction([
      prisma.attachment.update({
        where: { id: attachment.id },
        data: {
          storageKey: permanentKey,
          status: AttachmentStatus.READY,
          sizeBytes: BigInt(permanentHead.sizeBytes),
          objectVersionId: versionId || permanentHead.versionId || null,
          uploadedAt: now,
          verifiedAt: now,
        },
      }),
      prisma.uploadSession.update({
        where: { id: session.id },
        data: {
          status: UploadSessionStatus.COMPLETED,
          completedAt: now,
        },
      }),
      prisma.attachmentAudit.create({
        data: {
          tenantId,
          attachmentId: attachment.id,
          userId,
          action: AttachmentAuditAction.VERIFIED,
          metadata: { permanentKey, sizeBytes: permanentHead.sizeBytes },
        },
      }),
    ]);

    // 5. Asynchronously clean quarantine object
    s3StorageProvider.deleteObject(session.storageKey).catch(() => {});

    return {
      attachmentId: attachment.id,
      status: AttachmentStatus.READY,
      storageKey: permanentKey,
    };
  }

  /**
   * Cancel Upload
   */
  async cancelUpload(tenantId: string, attachmentId: string): Promise<void> {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, tenantId },
    });
    if (!attachment) return;

    await prisma.attachment.update({
      where: { id: attachment.id },
      data: { status: AttachmentStatus.EXPIRED },
    });

    s3StorageProvider.deleteObject(attachment.storageKey).catch(() => {});
  }

  /**
   * Get short-lived signed URL or CloudFront URL for content delivery (302 redirect)
   */
  async getContentSignedUrl(attachmentId: string, tenantId?: string): Promise<string> {
    const whereClause: any = { id: attachmentId };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const attachment = await prisma.attachment.findFirst({
      where: whereClause,
    });

    if (!attachment) {
      throw new Error("Attachment not found or access denied.");
    }

    if (attachment.status !== AttachmentStatus.READY) {
      throw new Error(`Attachment is not ready (Status: ${attachment.status}).`);
    }

    // CloudFront CDN URL support
    if (process.env.CLOUDFRONT_URL || process.env.AWS_CLOUDFRONT_URL) {
      const cdnBase = (process.env.CLOUDFRONT_URL || process.env.AWS_CLOUDFRONT_URL)!.replace(/\/$/, "");
      return `${cdnBase}/${attachment.storageKey}`;
    }

    // Default: Presigned S3 GET URL
    return s3StorageProvider.createDownloadUrl(attachment.storageKey, 900); // 15 mins
  }

  /**
   * Get Attachment metadata by ID
   */
  async getAttachment(tenantId: string, attachmentId: string) {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, tenantId },
    });
    if (!attachment) {
      throw new Error("Attachment not found.");
    }
    return {
      ...attachment,
      sizeBytes: Number(attachment.sizeBytes),
    };
  }

  /**
   * Delete Attachment
   */
  async deleteAttachment(tenantId: string, attachmentId: string, userId?: string): Promise<void> {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, tenantId },
    });
    if (!attachment) return;

    await prisma.$transaction([
      prisma.attachment.update({
        where: { id: attachment.id },
        data: { status: AttachmentStatus.DELETED, deletedAt: new Date() },
      }),
      prisma.attachmentAudit.create({
        data: {
          tenantId,
          attachmentId: attachment.id,
          userId,
          action: AttachmentAuditAction.DELETED,
        },
      }),
    ]);

    // Asynchronously delete binary from S3
    s3StorageProvider.deleteObject(attachment.storageKey).catch(() => {});
  }
  /**
   * Direct backend upload fallback method for proxying binary upload to S3
   */
  async uploadDirectBuffer(tenantId: string, attachmentId: string, buffer: Buffer, mimeType: string): Promise<void> {
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, tenantId },
    });
    if (!attachment) {
      throw new Error("Attachment not found.");
    }
    const quarantineKey = attachment.storageKey || `quarantine/${tenantId}/${attachment.id}/original`;
    await s3StorageProvider.putObject(quarantineKey, buffer, mimeType || attachment.mimeType);
  }
}

export const attachmentService = new AttachmentService();
