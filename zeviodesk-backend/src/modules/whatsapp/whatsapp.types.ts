export interface SendWhatsAppMessageDto {
  recipientPhone: string;
  message: string;
  templateName?: string;
}

export interface WhatsAppLogDto {
  id: string;
  recipientPhone: string;
  status: string;
  sentAt: string;
}
