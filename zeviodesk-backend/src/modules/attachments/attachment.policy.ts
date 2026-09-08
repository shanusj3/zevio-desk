import { AttachmentCategory } from "@prisma/client";
import { AttachmentPolicyConfig } from "./types/attachment.types";

export const ATTACHMENT_POLICIES: Record<AttachmentCategory, AttachmentPolicyConfig> = {
  TICKET_INTAKE_PHOTO: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    maxCount: 4,
    generateThumbnail: true,
  },
  TICKET_REPAIR_PHOTO: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    generateThumbnail: true,
  },
  TICKET_INTAKE_VIDEO: {
    allowedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    maxCount: 2,
    generateThumbnail: false,
  },
  TICKET_REPAIR_VIDEO: {
    allowedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    generateThumbnail: false,
  },
  TENANT_LOGO: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    maxSizeBytes: 2 * 1024 * 1024, // 2 MB
    maxCount: 1,
    generateThumbnail: false,
  },
  CUSTOMER_PICKUP_SIGNATURE: {
    allowedMimeTypes: ["image/png"],
    maxSizeBytes: 1 * 1024 * 1024, // 1 MB
    maxCount: 1,
    generateThumbnail: false,
  },
  PRODUCT_IMAGE: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    generateThumbnail: true,
  },
  PART_IMAGE: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    generateThumbnail: true,
  },
};

export function getAttachmentPolicy(category: AttachmentCategory): AttachmentPolicyConfig {
  const policy = ATTACHMENT_POLICIES[category];
  if (!policy) {
    throw new Error(`No attachment policy configured for category '${category}'`);
  }
  return policy;
}
