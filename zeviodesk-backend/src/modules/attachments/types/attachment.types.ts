import {
  AttachmentCategory,
  AttachmentEntityType,
  AttachmentStatus,
  ScanStatus,
  ProcessingStatus,
  UploadSessionStatus,
  AttachmentAuditAction,
} from "@prisma/client";

export interface InitiateUploadDto {
  entityType: AttachmentEntityType;
  entityId: string;
  category: AttachmentCategory;
  fileName?: string;
  mimeType: string;
  sizeBytes: number;
}

export interface InitiateUploadResponse {
  attachmentId: string;
  uploadSessionId: string;
  uploadUrl: string;
  expiresAt: string;
  storageKey: string;
}

export interface CompleteUploadResponse {
  attachmentId: string;
  status: AttachmentStatus;
  storageKey: string;
}

export interface AttachmentPolicyConfig {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  maxCount?: number;
  generateThumbnail?: boolean;
}
