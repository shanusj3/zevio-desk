import { Response } from "express";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response";
import { attachmentService } from "./attachment.service";
import { AttachmentCategory, AttachmentEntityType } from "@prisma/client";

export const attachmentController = {
  initiate: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return sendError(res, "Tenant ID missing from token", 403);
    }

    const { entityType, entityId, category, fileName, mimeType, sizeBytes } = req.body;

    if (!entityType || !entityId || !category || !mimeType || !sizeBytes) {
      return sendError(res, "Missing required fields: entityType, entityId, category, mimeType, sizeBytes", 400);
    }

    try {
      const result = await attachmentService.initiateUpload(tenantId, req.user?.id, {
        entityType: entityType as AttachmentEntityType,
        entityId,
        category: category as AttachmentCategory,
        fileName,
        mimeType,
        sizeBytes: Number(sizeBytes),
      });
      return sendSuccess(res, result, "Upload session initiated successfully", 201);
    } catch (err: any) {
      return sendError(res, err.message || "Failed to initiate upload session", 400);
    }
  }),

  uploadDirect: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return sendError(res, "Tenant ID missing from token", 403);
    }
    const { id } = req.params;
    const rawBody = (req as any).body;
    if (!rawBody || (!Buffer.isBuffer(rawBody) && !(rawBody instanceof Uint8Array))) {
      return sendError(res, "No file binary buffer received", 400);
    }
    const mimeType = (req.headers["content-type"] as string) || "application/octet-stream";
    try {
      await attachmentService.uploadDirectBuffer(tenantId, id, Buffer.from(rawBody), mimeType);
      return sendSuccess(res, { attachmentId: id }, "File uploaded successfully via backend proxy");
    } catch (err: any) {
      return sendError(res, err.message || "Failed to upload file via proxy", 400);
    }
  }),

  complete: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return sendError(res, "Tenant ID missing from token", 403);
    }

    const { id } = req.params;
    try {
      const result = await attachmentService.completeUpload(tenantId, id, req.user?.id);
      return sendSuccess(res, result, "Upload verified and promoted successfully");
    } catch (err: any) {
      return sendError(res, err.message || "Failed to complete upload", 400);
    }
  }),

  cancel: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return sendError(res, "Tenant ID missing from token", 403);
    }

    const { id } = req.params;
    await attachmentService.cancelUpload(tenantId, id);
    return sendSuccess(res, null, "Upload session cancelled");
  }),

  getContent: asyncHandler(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    try {
      const signedUrl = await attachmentService.getContentSignedUrl(id, tenantId);
      // HTTP 302 Redirect directly to CloudFront or Presigned S3 GET URL
      return res.redirect(302, signedUrl);
    } catch (err: any) {
      return sendError(res, err.message || "Attachment content unavailable", 404);
    }
  }),

  getThumbnail: asyncHandler(async (req: CustomRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    try {
      const signedUrl = await attachmentService.getContentSignedUrl(id, tenantId);
      return res.redirect(302, signedUrl);
    } catch (err: any) {
      return sendError(res, err.message || "Thumbnail content unavailable", 404);
    }
  }),

  getMetadata: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return sendError(res, "Tenant ID missing from token", 403);
    }

    const { id } = req.params;
    try {
      const metadata = await attachmentService.getAttachment(tenantId, id);
      return sendSuccess(res, metadata, "Attachment metadata retrieved");
    } catch (err: any) {
      return sendError(res, err.message || "Attachment not found", 404);
    }
  }),

  delete: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return sendError(res, "Tenant ID missing from token", 403);
    }

    const { id } = req.params;
    await attachmentService.deleteAttachment(tenantId, id, req.user?.id);
    return sendSuccess(res, null, "Attachment deleted successfully");
  }),
};
