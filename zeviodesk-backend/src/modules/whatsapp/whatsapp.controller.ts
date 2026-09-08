import { Response } from "express";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { whatsappModuleService } from "./whatsapp.service.js";
import { sendSuccess } from "../../utils/response.js";
import { activityService } from "../../services/activity.service.js";
import { encryptionUtils } from "../../utils/encryption.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ValidationError, UnauthorizedError, NotFoundError } from "../../errors/AppError.js";
import { whatsappEvents } from "./services/webhook.service.js";
import { env } from "../../config/env.js";
import { embeddedSignupService } from "./services/embedded-signup.service.js";

export const whatsappController = {
  /**
   * Connect a WhatsApp Business Account.
   * tenantId is derived from the authenticated user's JWT.
   */
  connect: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const { wabaId, phoneNumberId, accessToken } = req.body;
    if (!wabaId || !phoneNumberId || !accessToken) {
      throw new ValidationError("Missing required fields: wabaId, phoneNumberId, accessToken");
    }

    const encryptedToken = encryptionUtils.encrypt(accessToken);

    await prisma.tenantWhatsApp.upsert({
      where: { tenantId },
      update: {
        wabaId,
        phoneNumberId,
        accessToken: encryptedToken,
        status: "CONNECTED",
        connectedAt: new Date(),
        disconnectedAt: null
      },
      create: {
        tenantId,
        wabaId,
        phoneNumberId,
        accessToken: encryptedToken,
        status: "CONNECTED",
        connectedAt: new Date()
      },
    });

    await activityService.log("WhatsApp connected", `WABA ID: ${wabaId}`, tenantId);

    // Log Audit event
    await prisma.whatsAppAuditLog.create({
      data: {
        tenantId,
        action: "WHATSAPP_CONNECTED",
        details: `Connected WABA ID: ${wabaId}, Phone ID: ${phoneNumberId}`
      }
    });

    return sendSuccess(res, { success: true }, "WhatsApp connected successfully");
  }),

  /**
   * Complete Meta Embedded Signup by exchanging authorization code for credentials
   */
  completeEmbeddedSignup: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const { code } = req.body;
    if (!code) throw new ValidationError("Missing required authorization code");

    // Perform server-side OAuth exchange & subscriptions setup
    const waConfig = await embeddedSignupService.exchangeCodeAndConnect(
      tenantId,
      code,
      env.META_APP_ID,
      env.META_APP_SECRET
    );

    // Log Activity
    await activityService.log("WhatsApp connected via Embedded Signup", `WABA ID: ${waConfig.wabaId}`, tenantId);

    // Log Audit event
    await prisma.whatsAppAuditLog.create({
      data: {
        tenantId,
        action: "WHATSAPP_CONNECTED",
        details: `Connected WABA ID: ${waConfig.wabaId}, Phone ID: ${waConfig.phoneNumberId} via Embedded Signup`
      }
    });

    return sendSuccess(res, { success: true }, "WhatsApp connected successfully via Embedded Signup");
  }),

  /**
   * Disconnect WhatsApp integration
   */
  disconnect: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    await prisma.tenantWhatsApp.update({
      where: { tenantId },
      data: {
        status: "DISCONNECTED",
        disconnectedAt: new Date()
      }
    });

    await activityService.log("WhatsApp disconnected", undefined, tenantId);

    // Log Audit event
    await prisma.whatsAppAuditLog.create({
      data: {
        tenantId,
        action: "WHATSAPP_DISCONNECTED",
        details: "Integration disconnected by user request"
      }
    });

    return sendSuccess(res, { success: true }, "WhatsApp disconnected successfully");
  }),

  /**
   * Get WhatsApp Connection status
   */
  getStatus: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const waConfig = await prisma.tenantWhatsApp.findUnique({ where: { tenantId } });

    if (!waConfig || waConfig.status === "DISCONNECTED") {
      return sendSuccess(res, { 
        connected: false, 
        metaAppId: env.META_APP_ID, 
        metaConfigId: env.META_CONFIG_ID 
      }, "WhatsApp connection status");
    }

    return sendSuccess(
      res,
      {
        connected: true,
        wabaId: waConfig.wabaId,
        phoneNumberId: waConfig.phoneNumberId,
        status: waConfig.status,
        ticketCreatedEnabled: waConfig.ticketCreatedEnabled,
        readyForPickupEnabled: waConfig.readyForPickupEnabled,
        ticketCompletedEnabled: waConfig.ticketCompletedEnabled,
        metaAppId: env.META_APP_ID,
        metaConfigId: env.META_CONFIG_ID,
      },
      "WhatsApp connection status"
    );
  }),

  /**
   * Toggle automated notification settings per tenant
   */
  toggleAutomation: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const { type, enabled } = req.body;
    if (!["ticketCreated", "readyForPickup", "ticketCompleted"].includes(type)) {
      throw new ValidationError("Invalid automation type");
    }

    const field = `${type}Enabled`;

    await prisma.tenantWhatsApp.update({
      where: { tenantId },
      data: { [field]: !!enabled }
    });

    return sendSuccess(res, { success: true }, `Automation ${type} updated`);
  }),

  /**
   * Fetch conversations list for the team inbox
   */
  getConversations: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const status = req.query.status as string | undefined;
    const conversations = await whatsappModuleService.getConversations(tenantId, status);
    return sendSuccess(res, conversations, "Conversations list retrieved");
  }),

  /**
   * Get cursor-paginated messages for a conversation
   */
  getMessages: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const conversationId = req.params.id;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const data = await whatsappModuleService.getMessages(tenantId, conversationId, cursor, limit);
    return sendSuccess(res, data, "Messages list retrieved");
  }),

  /**
   * Send a reply message from the agent dashboard
   */
  sendReply: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const conversationId = req.params.id;
    const { body, clientMessageId } = req.body;
    if (!body) throw new ValidationError("Message body is required");

    const message = await whatsappModuleService.sendReply(tenantId, conversationId, body, clientMessageId);
    return sendSuccess(res, message, "Reply message dispatched");
  }),

  /**
   * Lock/Assign a conversation to a staff member
   */
  assignConversation: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const conversationId = req.params.id;
    const { assignedUserId } = req.body; // Pass null to unassign

    const updated = await whatsappModuleService.assignConversation(tenantId, conversationId, assignedUserId);
    return sendSuccess(res, updated, "Conversation assignee updated");
  }),

  /**
   * Close a conversation thread
   */
  closeConversation: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const conversationId = req.params.id;
    const closedById = req.user?.id || "system";

    const updated = await whatsappModuleService.closeConversation(tenantId, conversationId, closedById);
    return sendSuccess(res, updated, "Conversation closed");
  }),

  /**
   * Server-Sent Events (SSE) realtime channel for inbox updates
   */
  sse: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const listener = (event: any) => {
      if (event.tenantId === tenantId) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    };

    whatsappEvents.on("WHATSAPP_MESSAGE_RECEIVED", listener);
    whatsappEvents.on("WHATSAPP_STATUS_UPDATED", listener);

    req.on("close", () => {
      whatsappEvents.off("WHATSAPP_MESSAGE_RECEIVED", listener);
      whatsappEvents.off("WHATSAPP_STATUS_UPDATED", listener);
    });
  }),
};
