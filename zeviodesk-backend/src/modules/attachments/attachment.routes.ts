import express, { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { attachmentController } from "./attachment.controller";

const router = Router();

// Public GET endpoints for 302 redirects to presigned S3 / CloudFront URLs (used by <img> tags)
router.get("/:id/content", attachmentController.getContent);
router.get("/:id/thumbnail", attachmentController.getThumbnail);

// Protected attachment endpoints requiring tenant authentication
router.use(authMiddleware);

router.post("/initiate", attachmentController.initiate);
router.put("/:id/upload", express.raw({ type: "*/*", limit: "50mb" }), attachmentController.uploadDirect);
router.post("/:id/complete", attachmentController.complete);
router.post("/:id/cancel", attachmentController.cancel);
router.get("/:id", attachmentController.getMetadata);
router.delete("/:id", attachmentController.delete);

export default router;
