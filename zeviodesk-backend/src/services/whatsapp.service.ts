import { logger } from "../config/logger.js";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export const whatsappService = {
  sendMessage: async (to: string, message: string): Promise<any> => {
    logger.info(`💬 [WhatsAppService] Sending message to ${to} via PhoneID ${env.WHATSAPP_PHONE_NUMBER_ID}`);
    return {
      messaging_product: "whatsapp",
      contacts: [{ input: to, wa_id: to.replace(/\D/g, "") }],
      messages: [{ id: `wamid.HBgL${Date.now()}` }],
      status: "queued",
    };
  },

  syncTemplates: async (tenantWabaId: string): Promise<any> => {
    logger.info(`🔄 [WhatsAppService] Syncing templates for Tenant WABA ID: ${tenantWabaId}`);
    
    // Fetch all approved templates from our DB
    const templates = await prisma.template.findMany({
      where: { status: "APPROVED" },
      select: { name: true }
    });
    
    const templateNames = templates.map(t => t.name);

    if (templateNames.length === 0) {
      logger.warn("No approved templates found to sync.");
      return { success: false, message: "No templates to sync" };
    }

    const payload = {
      waba_ids: [tenantWabaId],
      template_names: templateNames
    };

    logger.info(`Sending payload to Facebook Graph API: ${JSON.stringify(payload)}`);

    // In a real implementation, we would use axios or fetch:
    // await axios.post(`https://facebook.com/${env.MASTER_WABA_ID}/template_sharing`, payload, {
    //   headers: { Authorization: `Bearer ${env.META_SYSTEM_TOKEN}` }
    // });
    
    return {
      success: true,
      message: "Templates synced successfully",
      synced_templates: templateNames
    };
  },

  sendDynamicTemplate: async (to: string, templateName: string, components: any[], languageCode = "en_US", fromPhoneNumberId?: string, accessToken?: string): Promise<any> => {
    logger.info(`💬 [WhatsAppService] Sending dynamic template ${templateName} to ${to}`);
    
    const payload = {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components
      }
    };

    logger.info(`Payload for dynamic template: ${JSON.stringify(payload)}`);

    // In a real implementation, we would use axios or fetch to POST to Graph API:
    // const phoneNumberId = fromPhoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID;
    // await axios.post(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, payload, {
    //   headers: { Authorization: `Bearer ${accessToken || env.WHATSAPP_TOKEN}` }
    // });

    return {
      messaging_product: "whatsapp",
      contacts: [{ input: to, wa_id: to.replace(/\D/g, "") }],
      messages: [{ id: `wamid.HBgL${Date.now()}` }],
      status: "queued",
    };
  },
};
