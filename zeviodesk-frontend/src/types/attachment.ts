export type AttachmentEntityType = 'TICKET' | 'PRODUCT' | 'PART' | 'CUSTOMER' | 'TENANT';

export type AttachmentCategory =
  | 'TICKET_INTAKE_PHOTO'
  | 'TICKET_REPAIR_PHOTO'
  | 'TICKET_INTAKE_VIDEO'
  | 'TICKET_REPAIR_VIDEO'
  | 'TENANT_LOGO'
  | 'CUSTOMER_PICKUP_SIGNATURE'
  | 'PRODUCT_IMAGE'
  | 'PART_IMAGE';

export type AttachmentStatus =
  | 'INITIATED'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'VERIFYING'
  | 'READY'
  | 'FAILED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'DELETED'
  | 'STORAGE_MISSING';

export interface InitiateUploadPayload {
  entityType: AttachmentEntityType;
  entityId: string;
  category: AttachmentCategory;
  fileName?: string;
  mimeType: string;
  sizeBytes: number;
}

export interface InitiateUploadResult {
  attachmentId: string;
  uploadSessionId: string;
  uploadUrl: string;
  expiresAt: string;
  storageKey: string;
}

export interface CompleteUploadResult {
  attachmentId: string;
  status: AttachmentStatus;
  storageKey: string;
}

export interface AttachmentItem {
  id: string;
  tenantId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  category: AttachmentCategory;
  originalFileName?: string;
  mimeType: string;
  sizeBytes: number;
  status: AttachmentStatus;
  createdAt: string;
  uploadedAt?: string;
}
