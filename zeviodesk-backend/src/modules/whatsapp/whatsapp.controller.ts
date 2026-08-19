import { Response } from "express";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { whatsappModuleService } from "./whatsapp.service.js";
import { sendSuccess } from "../../utils/response.js";
import { activityService } from "../../services/activity.service.js";
import { encryptionUtils } from "../../utils/encryption.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ValidationError, UnauthorizedError, NotFoundError } from "../../errors/AppError.js";

export const whatsappController = {
  /**
   * Legacy / cross-tenant send — SUPER_ADMIN only (enforced in routes).
   * Does NOT require a tenant context.
   */
  sendMessage: asyncHandler(async (req: CustomRequest, res: Response) => {
    const { recipientPhone, message, templateName } = req.body;
    if (!recipientPhone) throw new ValidationError("recipientPhone is required");

    const data = await whatsappModuleService.sendMessage({ recipientPhone, message, templateName });
    return sendSuccess(res, data, "WhatsApp message dispatched");
  }),

  /**
   * Legacy logs — SUPER_ADMIN only (enforced in routes).
   */
  getLogs: asyncHandler(async (req: CustomRequest, res: Response) => {
    const logs = await whatsappModuleService.getHistory();
    return sendSuccess(res, logs, "WhatsApp message logs");
  }),

  /**
   * Connect a WhatsApp Business Account.
   * tenantId is always derived from the authenticated user's token — body tenantId is ignored.
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
      update: { wabaId, phoneNumberId, accessToken: encryptedToken },
      create: { tenantId, wabaId, phoneNumberId, accessToken: encryptedToken },
    });

    await activityService.log("WhatsApp connected", `WABA ID: ${wabaId}`, tenantId);

    return sendSuccess(res, { success: true }, "WhatsApp connected successfully");
  }),

  syncTemplates: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const waConfig = await prisma.tenantWhatsApp.findUnique({ where: { tenantId } });
    if (!waConfig) throw new ValidationError("WhatsApp not connected for this tenant");

    const result = await whatsappModuleService.syncTemplates(waConfig.wabaId);

    await activityService.log("Templates synced", `Synced to WABA ID: ${waConfig.wabaId}`, tenantId);

    return sendSuccess(res, result, "Templates synced");
  }),

  sendTemplate: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const { to, templateName, components } = req.body;
    if (!to || !templateName) {
      throw new ValidationError("Missing required fields: to, templateName");
    }

    const waConfig = await prisma.tenantWhatsApp.findUnique({ where: { tenantId } });
    if (!waConfig) throw new ValidationError("WhatsApp not connected for this tenant");

    const decryptedToken = encryptionUtils.decrypt(waConfig.accessToken);

    const result = await whatsappModuleService.sendDynamicTemplate(
      to,
      templateName,
      components || [],
      waConfig.phoneNumberId,
      decryptedToken
    );

    await activityService.log("Template message sent", `Template: ${templateName}, To: ${to}`, tenantId);

    return sendSuccess(res, result, "Dynamic template message dispatched");
  }),

  sendInvoiceNotification: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const { ticketId } = req.body;
    if (!ticketId) throw new ValidationError("ticketId is required");

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { customer: true }
    });
    if (!ticket) throw new NotFoundError("Ticket not found");
    if (ticket.tenantId !== tenantId) throw new NotFoundError("Ticket not found");

    const customerPhone = ticket.customer?.phone;
    if (!customerPhone) {
      throw new ValidationError("Customer does not have a phone number to receive WhatsApp notifications");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { ticketId }
    });
    if (!invoice) {
      throw new ValidationError("No invoice found for this ticket. Generate and finalize the invoice first.");
    }
    if (invoice.status !== "FINALIZED") {
      throw new ValidationError("Invoice is in DRAFT state and must be finalized before sending notification.");
    }

    const waConfig = await prisma.tenantWhatsApp.findUnique({ where: { tenantId } });

    if (!waConfig) {
      const mockMessage = `Hi ${ticket.customer?.name || "Customer"}, your invoice ${invoice.invoiceNumber} for ticket #${ticket.jobNumber || ticket.id.slice(0, 8)} is ready. Total: INR ${invoice.total.toFixed(2)}. Balance Due: INR ${invoice.balanceDue.toFixed(2)}. Thank you for choosing Zeviodesk!`;
      
      await whatsappModuleService.sendMessage({
        recipientPhone: customerPhone,
        message: mockMessage
      });

      return sendSuccess(
        res,
        { mockSent: true, message: mockMessage },
        "WhatsApp configuration not connected; simulated notification sent to logs successfully."
      );
    }

    const decryptedToken = encryptionUtils.decrypt(waConfig.accessToken);
    
    const components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: ticket.customer?.name || "Customer" },
          { type: "text", text: ticket.jobNumber || ticket.id.slice(0, 8) },
          { type: "text", text: invoice.invoiceNumber || invoice.id.slice(0, 8) },
          { type: "text", text: `INR ${invoice.total.toFixed(2)}` },
          { type: "text", text: `INR ${invoice.balanceDue.toFixed(2)}` },
        ]
      }
    ];

    const result = await whatsappModuleService.sendDynamicTemplate(
      customerPhone,
      "invoice_finalized",
      components,
      waConfig.phoneNumberId,
      decryptedToken
    );

    await activityService.log("Invoice WhatsApp sent", `Invoice: ${invoice.invoiceNumber}, To: ${customerPhone}`, tenantId);

    return sendSuccess(res, result, "Invoice finalized WhatsApp notification dispatched");
  }),

  disconnect: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    await prisma.tenantWhatsApp.delete({ where: { tenantId } });

    await activityService.log("WhatsApp disconnected", undefined, tenantId);

    return sendSuccess(res, { success: true }, "WhatsApp disconnected");
  }),

  getStatus: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const waConfig = await prisma.tenantWhatsApp.findUnique({ where: { tenantId } });

    if (!waConfig) {
      return sendSuccess(res, { connected: false }, "WhatsApp status");
    }

    return sendSuccess(
      res,
      { connected: true, wabaId: waConfig.wabaId, phoneNumberId: waConfig.phoneNumberId },
      "WhatsApp status"
    );
  }),
};
