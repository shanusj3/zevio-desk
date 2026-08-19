import { prisma } from "../../config/prisma.js";
import fs from "fs";

export const ticketRepository = {
  findAll: async (tenantId?: string, status?: string, assignedToId?: string, startDate?: Date, endDate?: Date, statusIn?: string[], skip?: number, take?: number) => {
    fs.appendFileSync('debug_query.log', JSON.stringify({ tenantId, status, assignedToId, startDate, endDate, statusIn, skip, take }) + '\n');
    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (assignedToId) where.assignedToId = assignedToId;

    // Single status filter OR multiple statuses (role-based)
    if (statusIn && statusIn.length > 0) {
      where.status = { in: statusIn };
    } else if (status) {
      where.status = status;
    }

    // Date range filter on createdAt
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take,
        include: {
          customer: true,
          assignedTo: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ticket.count({ where })
    ]);

    return { data, total };
  },

  findById: async (id: string) => {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: { select: { name: true, email: true } },
        payments: {
          orderBy: { paidAt: "desc" },
          include: { recordedBy: { select: { name: true } } },
        },
      },
    });
  },

  findReadyForPickup: async (tenantId: string) =>
    prisma.ticket.findMany({
      where: { tenantId, status: "READY_FOR_PICKUP" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true, paymentStatus: true, total: true, amountPaid: true, balanceDue: true } },
      },
      orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    }),

  create: async (data: any) => {
    return prisma.ticket.create({ data });
  },

  update: async (id: string, data: any) => {
    return prisma.ticket.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return prisma.ticket.delete({ where: { id } });
  },
};
