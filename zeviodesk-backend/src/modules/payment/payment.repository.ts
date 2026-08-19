import { prisma } from "../../config/prisma.js";

export const paymentRepository = {
  findByTicketId: async (ticketId: string) => {
    return prisma.payment.findMany({
      where: { ticketId },
      include: { recordedBy: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
    });
  },

  create: async (data: {
    ticketId: string;
    tenantId: string;
    amount: number;
    type: string;
    method?: string | null;
    notes?: string | null;
    reference?: string | null;
    recordedById?: string | null;
    paidAt?: Date;
  }) => {
    return prisma.payment.create({
      data: data as any,
      include: { recordedBy: { select: { name: true } } },
    });
  },

  findById: async (id: string) => {
    return prisma.payment.findUnique({
      where: { id },
      include: { recordedBy: { select: { name: true } } },
    });
  },

  delete: async (id: string) => {
    return prisma.payment.delete({ where: { id } });
  },
};
