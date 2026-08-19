import { whatsappService as waService } from "../../services/whatsapp.service.js";
import { whatsappRepository } from "./whatsapp.repository.js";
import { SendWhatsAppMessageDto } from "./whatsapp.types.js";

export const whatsappModuleService = {
  sendMessage: async (dto: SendWhatsAppMessageDto) => {
    let result;
    if (dto.templateName) {
      // Assuming sendTemplate was removed/changed in the root service, we can use sendDynamicTemplate here 
      // if backward compatibility is needed, but for now we'll call a fallback or the dynamic one without components.
      result = await waService.sendMessage(dto.recipientPhone, `Template: ${dto.templateName}`);
    } else {
      result = await waService.sendMessage(dto.recipientPhone, dto.message || "");
    }

    const log = await whatsappRepository.logMessage(
      dto.recipientPhone,
      dto.message || `Template: ${dto.templateName}`,
      "DELIVERED",
      result
    );

    return { result, log };
  },

  getHistory: async () => {
    return whatsappRepository.getLogs();
  },

  syncTemplates: async (tenantWabaId: string) => {
    return waService.syncTemplates(tenantWabaId);
  },

  sendDynamicTemplate: async (
    to: string, 
    templateName: string, 
    components: any[], 
    fromPhoneNumberId?: string, 
    accessToken?: string
  ) => {
    const result = await waService.sendDynamicTemplate(
      to, 
      templateName, 
      components, 
      "en_US", 
      fromPhoneNumberId, 
      accessToken
    );

    await whatsappRepository.logMessage(
      to,
      `Dynamic Template: ${templateName}`,
      "DELIVERED",
      result
    );

    return result;
  }
};
