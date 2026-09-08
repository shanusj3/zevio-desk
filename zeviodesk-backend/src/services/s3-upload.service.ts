import crypto from "crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || "zevio-desk-uploads";

export function extractObjectKey(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;
  if (urlOrKey.startsWith("data:") || urlOrKey.startsWith("blob:")) {
    return urlOrKey;
  }
  if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
    try {
      const parsed = new URL(urlOrKey);
      return parsed.pathname.replace(/^\//, "");
    } catch {
      return urlOrKey;
    }
  }
  return urlOrKey;
}

export function getPublicUrl(keyOrUrl: string | null | undefined): string | null {
  if (!keyOrUrl) return null;
  if (keyOrUrl.startsWith("data:") || keyOrUrl.startsWith("blob:") || keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    return keyOrUrl;
  }
  const relativeKey = extractObjectKey(keyOrUrl);
  if (!relativeKey) return null;

  const baseUrl = (
    process.env.AWS_S3_PUBLIC_BASE_URL ||
    `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`
  ).replace(/\/$/, "");

  return `${baseUrl}/${relativeKey.replace(/^\//, "")}`;
}

export async function generatePresignedUpload(
  key: string,
  contentType: string,
  maxSizeBytes: number
) {
  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: S3_BUCKET,
    Key: key,
    Conditions: [
      ["content-length-range", 0, maxSizeBytes],
      ["eq", "$Content-Type", contentType],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 300,
  });

  return { url, fields, fileUrl: getPublicUrl(key) };
}

export async function generateTenantLogoPresign(tenantId: string, contentType: string) {
  if (!contentType.startsWith("image/")) {
    throw new Error("Invalid file type. Only images are allowed.");
  }
  const fileId = crypto.randomUUID();
  const ext = contentType.split("/")[1] || "png";
  const key = `tenants/${tenantId}/logo/${fileId}.${ext}`;
  return generatePresignedUpload(key, contentType, 2 * 1024 * 1024);
}

export async function generateTicketAttachmentPresign(
  tenantId: string,
  ticketId: string,
  contentType: string,
  fileType: "photo" | "video"
) {
  const isPhoto = fileType === "photo";
  if (isPhoto && !contentType.startsWith("image/")) {
    throw new Error("Invalid file type. Only images are allowed for photos.");
  }
  if (!isPhoto && !contentType.startsWith("video/")) {
    throw new Error("Invalid file type. Only videos are allowed for video uploads.");
  }

  const maxSize = isPhoto ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
  const fileId = crypto.randomUUID();
  const ext = contentType.split("/")[1] || (isPhoto ? "jpg" : "mp4");
  const key = `tenants/${tenantId}/tickets/${ticketId}/attachments/${fileId}.${ext}`;
  return generatePresignedUpload(key, contentType, maxSize);
}
