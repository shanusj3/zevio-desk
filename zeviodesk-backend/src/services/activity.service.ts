import { prisma } from "../config/prisma.js";

export const activityService = {
  log: async (action: string, details?: string, tenantId?: string, userId?: string) => {
    try {
      await prisma.activityLog.create({
        data: {
          action,
          details,
          tenantId,
          userId,
        },
      });
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  },
};
