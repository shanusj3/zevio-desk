import { prisma } from "../../config/prisma.js";

// ─── Line Item Repository ─────────────────────────────────────────────────────
export const lineItemRepository = {
  findByTicketId: (ticketId: string) =>
    prisma.ticketLineItem.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
    }),

  findById: (id: string) =>
    prisma.ticketLineItem.findUnique({ where: { id } }),

  create: (data: Parameters<typeof prisma.ticketLineItem.create>[0]["data"]) =>
    prisma.ticketLineItem.create({ data }),

  update: (id: string, data: Parameters<typeof prisma.ticketLineItem.update>[0]["data"]) =>
    prisma.ticketLineItem.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.ticketLineItem.delete({ where: { id } }),

  deleteByTicketId: (ticketId: string) =>
    prisma.ticketLineItem.deleteMany({ where: { ticketId } }),
};

// ─── Invoice Repository ───────────────────────────────────────────────────────
export const invoiceRepository = {
  findByTicketId: (ticketId: string) =>
    prisma.invoice.findUnique({
      where: { ticketId },
      include: {
        ticket: {
          select: {
            id: true, title: true, brand: true, model: true,
            customer: { select: { id: true, name: true, phone: true, email: true } },
            tenant: { select: { id: true, name: true, phone: true, businessEmail: true } },
          },
        },
        payments: { orderBy: { paidAt: "asc" } },
      },
    }),

  findById: (id: string) =>
    prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { paidAt: "asc" } },
      },
    }),

  create: (data: Parameters<typeof prisma.invoice.create>[0]["data"]) =>
    prisma.invoice.create({ data }),

  update: (id: string, data: Parameters<typeof prisma.invoice.update>[0]["data"]) =>
    prisma.invoice.update({ where: { id }, data }),
};
