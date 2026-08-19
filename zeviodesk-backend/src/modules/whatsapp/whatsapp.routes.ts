import { Router } from "express";
import { whatsappController } from "./whatsapp.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth);

// Legacy global endpoints expose cross-tenant data — restrict to SUPER_ADMIN only.
// These should be removed or replaced with tenant-scoped equivalents in a future cleanup.
router.post("/send", requireRole(["SUPER_ADMIN"]), whatsappController.sendMessage);
router.get("/logs", requireRole(["SUPER_ADMIN"]), whatsappController.getLogs);

// Tenant-scoped endpoints — SUPER_ADMIN and TENANT_ADMIN only.
// tenantId is always derived from the authenticated user's JWT; body values are ignored.
router.post("/connect",        requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.connect);
router.post("/sync-templates", requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.syncTemplates);
router.post("/send-template",  requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.sendTemplate);
router.post("/send-invoice-notification", requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"]), whatsappController.sendInvoiceNotification);
router.post("/disconnect",     requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.disconnect);
router.get("/status",          requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.getStatus);

export default router;
