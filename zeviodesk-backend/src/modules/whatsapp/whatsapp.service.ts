import { prisma } from "../../config/prisma.js";
import { metaWhatsappClient } from "./meta/meta-whatsapp.client.js";
import { encryptionUtils } from "../../utils/encryption.js";
import { ValidationError, NotFoundError } from "../../errors/AppError.js";
import { WhatsAppMessageType, WhatsAppMessageStatus } from "@prisma/client";

export const whatsappModuleService = {
  /**
   * Determine if a conversation is inside Meta's 24-hour customer service window
   */
  canSendFreeformMessage: async (conversationId: string): Promise<boolean> => {
    const conversation = await prisma.whatsAppConversation.findUnique({
      where: { id: conversationId }
    });
    if (!conversation || !conversation.lastInboundAt) return false;
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    return (Date.now() - conversation.lastInboundAt.getTime()) <= windowMs;
  },

  /**
   * Retrieve list of conversations with their contacts, sorted by last message
   */
  getConversations: async (tenantId: string, status?: string) => {
    return prisma.whatsAppConversation.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {})
      },
      include: {
        contact: true
      },
      orderBy: {
        lastMessageAt: "desc"
      }
    });
  },

  /**
   * Cursor-based messages pagination for high-volume chat threads
   */
  getMessages: async (
    tenantId: string,
    conversationId: string,
    cursor?: string,
    limit = 20
  ) => {
    // Validate conversation belongs to tenant
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, tenantId }
    });
    if (!conversation) throw new NotFoundError("Conversation not found");

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        tenantId,
        conversationId
      },
      take: limit + 1, // Fetch an extra item to resolve the next cursor
      ...(cursor ? {
        skip: 1, // Skip the cursor itself
        cursor: { id: cursor }
      } : {}),
      orderBy: {
        createdAt: "desc"
      }
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    return {
      messages,
      nextCursor
    };
  },

  /**
   * Send a free-form message reply to a customer
   */
  sendReply: async (
    tenantId: string,
    conversationId: string,
    body: string,
    clientMessageId?: string
  ) => {
    // 1. Fetch conversation details & tenant credentials
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, tenantId },
      include: { contact: true }
    });
    if (!conversation) throw new NotFoundError("Conversation not found");

    const waConfig = await prisma.tenantWhatsApp.findUnique({
      where: { tenantId }
    });
    if (!waConfig) throw new ValidationError("WhatsApp integration not connected for this tenant");

    // 2. Validate outbound idempotency
    if (clientMessageId) {
      const existingMessage = await prisma.whatsAppMessage.findUnique({
        where: { tenantId_clientMessageId: { tenantId, clientMessageId } }
      });
      if (existingMessage) return existingMessage;
    }

    // 3. Centralized messaging-window check
    const isWithinWindow = await whatsappModuleService.canSendFreeformMessage(conversationId);
    if (!isWithinWindow) {
      throw new ValidationError("Customer service window has expired. Outbound replies require an approved template.");
    }

    const decryptedToken = encryptionUtils.decrypt(waConfig.accessToken);
    const recipientPhone = conversation.contact.phoneNumber.replace("+", "");

    // 4. Create PENDING message entry in PostgreSQL first
    const newMessage = await prisma.whatsAppMessage.create({
      data: {
        tenantId,
        conversationId,
        contactId: conversation.contactId,
        direction: "OUTBOUND",
        type: "TEXT",
        body,
        clientMessageId,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    try {
      // 5. Send message via Meta client
      const metaResult = await metaWhatsappClient.sendTextMessage(
        recipientPhone,
        body,
        waConfig.phoneNumberId,
        decryptedToken
      );

      const whatsappMessageId = metaResult.messages?.[0]?.id || null;

      // 6. Update message entry with Meta ID and status SENT
      const updatedMessage = await prisma.whatsAppMessage.update({
        where: { id: newMessage.id },
        data: {
          whatsappMessageId,
          status: "SENT"
        }
      });

      // Update conversation timestamps
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      return updatedMessage;
    } catch (err: any) {
      // 7. Handle failure states cleanly
      const failedMessage = await prisma.whatsAppMessage.update({
        where: { id: newMessage.id },
        data: {
          status: "FAILED",
          errorMessage: err.message || "Failed to dispatch message to Meta API"
        }
      });
      return failedMessage;
    }
  },

  /**
   * Assign a conversation to a workshop employee
   */
  assignConversation: async (tenantId: string, conversationId: string, assignedUserId: string | null) => {
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, tenantId }
    });
    if (!conversation) throw new NotFoundError("Conversation not found");

    if (assignedUserId) {
      const userExists = await prisma.user.findFirst({
        where: { id: assignedUserId, tenantId }
      });
      if (!userExists) throw new ValidationError("Assignee user does not exist in this tenant");
    }

    const updated = await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { assignedUserId }
    });

    // Log Audit event
    await prisma.whatsAppAuditLog.create({
      data: {
        tenantId,
        action: "CONVERSATION_ASSIGNED",
        details: `Conversation assigned to: ${assignedUserId || "Unassigned"}`
      }
    });

    return updated;
  },

  /**
   * Close a conversation thread
   */
  closeConversation: async (tenantId: string, conversationId: string, closedById: string) => {
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id: conversationId, tenantId }
    });
    if (!conversation) throw new NotFoundError("Conversation not found");

    const updated = await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedBy: closedById
      }
    });

    // Log Audit event
    await prisma.whatsAppAuditLog.create({
      data: {
        tenantId,
        action: "CONVERSATION_CLOSED",
        details: `Closed by user: ${closedById}`
      }
    });

    return updated;
  }
};
export { WhatsAppMessageType };
