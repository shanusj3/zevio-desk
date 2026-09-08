import crypto from "crypto";
import { prisma } from "../../../config/prisma.js";
import { env } from "../../../config/env.js";
import { ValidationError, NotFoundError } from "../../../errors/AppError.js";
import { WhatsAppMessageType, WhatsAppMessageStatus } from "@prisma/client";

// Simple EventEmitter or broadcaster stub to trigger realtime updates.
// We can emit events that controllers/services can hook into.
import { EventEmitter } from "events";
export const whatsappEvents = new EventEmitter();

export const webhookService = {
  /**
   * Verify verification token challenge from Meta GET request
   */
  verifyChallenge: (query: any): string => {
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    throw new ValidationError("Verification token mismatch");
  },

  /**
   * Verify HMAC-SHA256 signature from Meta webhook request payload
   */
  verifySignature: (rawBody: Buffer | undefined, signatureHeader: string | undefined): boolean => {
    if (!rawBody || !signatureHeader) return false;
    
    const parts = signatureHeader.split("=");
    if (parts[0] !== "sha256" || !parts[1]) return false;

    const signatureHash = parts[1];
    const expectedHash = crypto
      .createHmac("sha256", env.META_APP_SECRET)
      .update(rawBody)
      .digest("hex");

    try {
      return crypto.timingSafeEqual(Buffer.from(signatureHash), Buffer.from(expectedHash));
    } catch {
      return false;
    }
  },

  /**
   * Process Meta Webhook POST payload
   */
  processWebhookPayload: async (payload: any) => {
    if (payload.object !== "whatsapp_business_account" || !payload.entry?.[0]) {
      return { processed: false, reason: "Not a WABA event" };
    }

    const entry = payload.entry[0];
    const change = entry.changes?.[0];
    if (!change || change.field !== "messages") {
      return { processed: false, reason: "No messages/changes field" };
    }

    const value = change.value;
    const metadata = value?.metadata;
    if (!metadata || !metadata.phone_number_id) {
      return { processed: false, reason: "Metadata or phone_number_id missing" };
    }

    const phoneNumberId = metadata.phone_number_id;

    // 1. Resolve tenant context from phoneNumberId
    const tenantConfig = await prisma.tenantWhatsApp.findUnique({
      where: { phoneNumberId }
    });

    if (!tenantConfig) {
      return { processed: false, reason: `WABA phone number ${phoneNumberId} not registered` };
    }

    const tenantId = tenantConfig.tenantId;

    // 2. Handle Inbound Messages
    if (value.messages?.[0]) {
      const message = value.messages[0];
      const customerPhone = message.from; // e.g. "919876543210"
      const whatsappMessageId = message.id;
      const messageBody = message.text?.body || "";
      const messageTypeRaw = message.type?.toUpperCase();
      
      const formattedPhone = `+${customerPhone}`;

      // A. Webhook Idempotency Check
      const existingMessage = await prisma.whatsAppMessage.findFirst({
        where: { tenantId, whatsappMessageId }
      });
      if (existingMessage) {
        return { processed: true, message: "Duplicate webhook processed", messageId: existingMessage.id };
      }

      // B. Resolve Zeviodesk Customer mapping if it exists
      const zevioCustomer = await prisma.customer.findFirst({
        where: { 
          tenantId,
          phone: {
            endsWith: customerPhone.slice(-10) // match last 10 digits to bypass prefix formatting discrepancies
          }
        }
      });

      const profileName = value.contacts?.[0]?.profile?.name || null;

      // C. Find or Create WhatsAppContact
      let contact = await prisma.whatsAppContact.findUnique({
        where: {
          tenantId_phoneNumber: {
            tenantId,
            phoneNumber: formattedPhone
          }
        }
      });

      if (!contact) {
        contact = await prisma.whatsAppContact.create({
          data: {
            tenantId,
            phoneNumber: formattedPhone,
            profileName,
            customerId: zevioCustomer?.id || null,
            lastMessageAt: new Date()
          }
        });
      } else {
        contact = await prisma.whatsAppContact.update({
          where: { id: contact.id },
          data: {
            profileName: profileName || contact.profileName,
            customerId: zevioCustomer?.id || contact.customerId,
            lastMessageAt: new Date()
          }
        });
      }

      // D. Find or Create WhatsAppConversation
      let conversation = await prisma.whatsAppConversation.findFirst({
        where: { tenantId, contactId: contact.id }
      });

      if (!conversation) {
        conversation = await prisma.whatsAppConversation.create({
          data: {
            tenantId,
            contactId: contact.id,
            status: "OPEN",
            lastInboundAt: new Date(),
            lastMessageAt: new Date(),
            unreadCount: 1
          }
        });
      } else {
        conversation = await prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: {
            status: "OPEN", // Reopen conversation on incoming message
            lastInboundAt: new Date(),
            lastMessageAt: new Date(),
            unreadCount: conversation.unreadCount + 1
          }
        });
      }

      // E. Parse Message Type Enum
      let type: WhatsAppMessageType = "TEXT";
      if (messageTypeRaw === "IMAGE") type = "IMAGE";
      if (messageTypeRaw === "DOCUMENT") type = "DOCUMENT";
      if (messageTypeRaw === "TEMPLATE") type = "TEMPLATE";

      // F. Create WhatsAppMessage
      const newMessage = await prisma.whatsAppMessage.create({
        data: {
          tenantId,
          conversationId: conversation.id,
          contactId: contact.id,
          whatsappMessageId,
          direction: "INBOUND",
          type,
          body: messageBody,
          status: "DELIVERED",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // G. Emit Realtime Events via Event Emitter
      whatsappEvents.emit("WHATSAPP_MESSAGE_RECEIVED", {
        tenantId,
        message: newMessage,
        conversation
      });

      return { processed: true, messageId: newMessage.id };
    }

    // 3. Handle Message Status Updates (Delivered, Read, Failed)
    if (value.statuses?.[0]) {
      const statusEntry = value.statuses[0];
      const whatsappMessageId = statusEntry.id;
      const statusRaw = statusEntry.status?.toUpperCase();

      let status: WhatsAppMessageStatus = "SENT";
      if (statusRaw === "DELIVERED") status = "DELIVERED";
      if (statusRaw === "READ") status = "READ";
      if (statusRaw === "FAILED") status = "FAILED";

      const existingMessage = await prisma.whatsAppMessage.findFirst({
        where: { tenantId, whatsappMessageId }
      });

      if (existingMessage) {
        const updatedMessage = await prisma.whatsAppMessage.update({
          where: { id: existingMessage.id },
          data: { 
            status,
            ...(status === "FAILED" ? { 
              errorCode: statusEntry.errors?.[0]?.code?.toString() || null, 
              errorMessage: statusEntry.errors?.[0]?.title || null 
            } : {})
          }
        });

        // Emit realtime update event
        whatsappEvents.emit("WHATSAPP_STATUS_UPDATED", {
          tenantId,
          message: updatedMessage
        });

        return { processed: true, statusUpdated: updatedMessage.id, status };
      }

      return { processed: false, reason: `Message ID ${whatsappMessageId} not found to update status` };
    }

    return { processed: false, reason: "Unhandled WABA messages payload variant" };
  }
};
