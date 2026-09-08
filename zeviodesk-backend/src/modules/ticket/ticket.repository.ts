import { prisma } from "../../config/prisma.js";
import fs from "fs";

export const ticketRepository = {
  findAll: async (
    tenantId?: string,
    status?: string,
    assignedToId?: string,
    startDate?: Date,
    endDate?: Date,
    statusIn?: string[],
    skip?: number,
    take?: number,
    search?: string,
    priority?: string
  ) => {
    const where: any = {};

    if (tenantId) where.tenantId = tenantId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (priority && priority !== "All") where.priority = priority;

    // Single status filter OR multiple statuses (role-based)
    if (statusIn && statusIn.length > 0) {
      where.status = { in: statusIn };
    } else if (status && status !== "All") {
      where.status = status;
    }

    // Date range filter on createdAt
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Search query on ticketId, ticketNumber, jobNumber, brand, model, serialNumber, customer name/phone
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { ticketNumber: { contains: q, mode: "insensitive" } },
        { jobNumber: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { phone: { contains: q, mode: "insensitive" } } },
        { customer: { secondaryPhone: { contains: q, mode: "insensitive" } } },
      ];
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
      prisma.ticket.count({ where }),
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
        assignedTo: { select: { id: true, name: true, email: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true, paymentStatus: true, total: true, amountPaid: true, balanceDue: true } },
      },
      orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    }),

  findRepairCompleted: async (tenantId: string) =>
    prisma.ticket.findMany({
      where: { tenantId, status: "REPAIR_COMPLETED" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
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
