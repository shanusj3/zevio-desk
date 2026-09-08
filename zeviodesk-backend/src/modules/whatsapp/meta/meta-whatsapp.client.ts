import { ValidationError } from "../../../errors/AppError.js";

const META_API_VERSION = "v20.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export const metaWhatsappClient = {
  /**
   * Send a free-form text message via WhatsApp Cloud API
   */
  sendTextMessage: async (
    to: string,
    body: string,
    fromPhoneNumberId: string,
    accessToken: string
  ) => {
    const url = `${META_BASE_URL}/${fromPhoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send text message via Meta");
    }
    return data;
  },

  /**
   * Send a template message via WhatsApp Cloud API
   */
  sendTemplateMessage: async (
    to: string,
    templateName: string,
    languageCode: string,
    components: any[],
    fromPhoneNumberId: string,
    accessToken: string
  ) => {
    const url = `${META_BASE_URL}/${fromPhoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send template message via Meta");
    }
    return data;
  },

  /**
   * Send a document message via WhatsApp Cloud API
   */
  sendDocumentMessage: async (
    to: string,
    documentUrl: string,
    fileName: string,
    caption: string | null,
    fromPhoneNumberId: string,
    accessToken: string
  ) => {
    const url = `${META_BASE_URL}/${fromPhoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
          link: documentUrl,
          filename: fileName,
          ...(caption ? { caption } : {}),
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send document message via Meta");
    }
    return data;
  },

  /**
   * Send an image message via WhatsApp Cloud API
   */
  sendImageMessage: async (
    to: string,
    imageUrl: string,
    caption: string | null,
    fromPhoneNumberId: string,
    accessToken: string
  ) => {
    const url = `${META_BASE_URL}/${fromPhoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "image",
        image: {
          link: imageUrl,
          ...(caption ? { caption } : {}),
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send image message via Meta");
    }
    return data;
  },

  /**
   * Mark an incoming message as read
   */
  markMessageAsRead: async (
    messageId: string,
    fromPhoneNumberId: string,
    accessToken: string
  ) => {
    const url = `${META_BASE_URL}/${fromPhoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to mark message as read via Meta");
    }
    return data;
  },

  /**
   * Upload media to Meta WhatsApp servers
   */
  uploadMedia: async (
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    fromPhoneNumberId: string,
    accessToken: string
  ) => {
    const url = `${META_BASE_URL}/${fromPhoneNumberId}/media`;
    
    // Construct form-data manually to avoid external libraries
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    
    const header = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
      `Content-Type: ${mimeType}`,
      "",
      "",
    ].join("\r\n");

    const metadataPart = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="messaging_product"`,
      "",
      "whatsapp",
      `--${boundary}--`,
      "",
    ].join("\r\n");

    const payload = Buffer.concat([
      Buffer.from(header, "utf-8"),
      fileBuffer,
      Buffer.from("\r\n", "utf-8"),
      Buffer.from(metadataPart, "utf-8"),
    ]);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to upload media to Meta");
    }
    return data; // returns { id: "media_id" }
  },

  /**
   * Get Media URL from Meta server (requires secondary request to download)
   */
  getMediaUrl: async (mediaId: string, accessToken: string) => {
    const url = `${META_BASE_URL}/${mediaId}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch media metadata from Meta");
    }
    return data; // returns { url: "download_url", mime_type: "...", file_size: ... }
  },

  /**
   * Fetch approved/pending templates from WABA
   */
  getTemplates: async (wabaId: string, accessToken: string) => {
    const url = `${META_BASE_URL}/${wabaId}/message_templates`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch templates from Meta");
    }
    return data; // returns { data: [...] }
  },

  /**
   * Create template on WABA
   */
  createTemplate: async (
    wabaId: string,
    templateData: any,
    accessToken: string
  ) => {
    const url = `${META_BASE_URL}/${wabaId}/message_templates`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templateData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create template via Meta");
    }
    return data; // returns { id: "template_id", status: "PENDING" }
  },
};
