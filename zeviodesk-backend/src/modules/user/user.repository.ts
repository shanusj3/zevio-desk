import { prisma } from "../../config/prisma.js";

export const userRepository = {
  findAll: async (tenantId?: string) => {
    return prisma.user.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  findById: async (id: string) => {
    return prisma.user.findUnique({ where: { id } });
  },

  create: async (data: any) => {
    return prisma.user.create({ data });
  },

  update: async (id: string, data: any) => {
    return prisma.user.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return prisma.user.delete({ where: { id } });
  },
};
