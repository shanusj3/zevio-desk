import { Router } from "express";
import { whatsappController } from "./whatsapp.controller.js";
import { whatsappWebhookController } from "./controllers/whatsapp-webhook.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

// ── Webhook Endpoints (Unauthenticated — Meta verification/events) ─────────────────
router.get("/webhook", whatsappWebhookController.verify);
router.post("/webhook", whatsappWebhookController.handle);

// ── Tenant Authenticated Endpoints ──────────────────────────────────────────────────
router.use(requireAuth);

router.post("/connect",            requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.connect);
router.post("/embedded-signup/complete", requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.completeEmbeddedSignup);
router.post("/disconnect",         requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.disconnect);
router.get("/status",              requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.getStatus);
router.post("/toggle-automation",  requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), whatsappController.toggleAutomation);

// Conversations & Inbox Team Messaging
router.get("/conversations",             requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"]), whatsappController.getConversations);
router.get("/conversations/:id/messages", requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"]), whatsappController.getMessages);
router.post("/conversations/:id/messages", requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"]), whatsappController.sendReply);
router.post("/conversations/:id/assign",   requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"]), whatsappController.assignConversation);
router.post("/conversations/:id/close",    requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"]), whatsappController.closeConversation);

// Realtime SSE Event Pipeline
router.get("/events", whatsappController.sse);

export default router;
