const whatsappLogs: any[] = [];

export const whatsappRepository = {
  logMessage: async (recipientPhone: string, message: string, status: string, response: any) => {
    const log = {
      id: `wa-log-${Date.now().toString(36)}`,
      recipientPhone,
      message,
      status,
      response,
      sentAt: new Date().toISOString(),
    };
    whatsappLogs.push(log);
    return log;
  },

  getLogs: async () => whatsappLogs,
};
