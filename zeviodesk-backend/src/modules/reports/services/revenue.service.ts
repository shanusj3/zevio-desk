import { prisma } from "../../../config/prisma.js";

export const revenueService = {
  getRevenueMetrics: async (tenantId: string, startDate: Date, endDate: Date) => {
    // 1. Invoices & Payments summary
    const finalizedInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: "FINALIZED",
        finalizedAt: { gte: startDate, lte: endDate },
      },
      select: {
        total: true,
        tax: true,
        balanceDue: true,
      },
    });

    const totalInvoiced = finalizedInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        paidAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        type: true,
        method: true,
        paidAt: true,
      },
    });

    const totalCollected = payments
      .filter(p => p.type !== "REFUND")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const refunded = payments
      .filter(p => p.type === "REFUND")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Outstanding invoices (all finalized invoices with balance due)
    const outstandingInvoices = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: "FINALIZED",
        balanceDue: { gt: 0 },
      },
      _sum: {
        balanceDue: true,
      },
    });
    const outstanding = Number(outstandingInvoices._sum.balanceDue || 0);

    // 2. Revenue trend by day (collected payments in the period)
    const dailyMap: Record<string, number> = {};
    
    // Initialize day-by-day map to ensure days with 0 revenue are still included
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().slice(0, 10);
      dailyMap[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }

    payments.forEach((p) => {
      if (p.type !== "REFUND") {
        const dateStr = p.paidAt.toISOString().slice(0, 10);
        if (dailyMap[dateStr] !== undefined) {
          dailyMap[dateStr] += Number(p.amount || 0);
        } else {
          dailyMap[dateStr] = Number(p.amount || 0);
        }
      }
    });

    const revenueByPeriod = Object.keys(dailyMap)
      .sort()
      .map(date => ({
        date,
        amount: parseFloat(dailyMap[date].toFixed(2)),
      }));

    // 3. Revenue by Service Type / Item Category (tickets created or finalized in period)
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        itemCategory: true,
        totalAmount: true,
      },
    });

    const categoryMap: Record<string, number> = {};
    tickets.forEach((t) => {
      const category = t.itemCategory || "Other";
      categoryMap[category] = (categoryMap[category] || 0) + Number(t.totalAmount || 0);
    });

    const revenueByServiceType = Object.keys(categoryMap).map(category => ({
      name: category,
      value: parseFloat(categoryMap[category].toFixed(2)),
    }));

    // 4. Revenue by Technician (tickets completed/finalized in period and assigned to agent)
    const completedTickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        assignedToId: { not: null },
      },
      select: {
        assignedTo: {
          select: {
            name: true,
          },
        },
        totalAmount: true,
      },
    });

    const techMap: Record<string, number> = {};
    completedTickets.forEach((t) => {
      if (t.assignedTo) {
        const techName = t.assignedTo.name;
        techMap[techName] = (techMap[techName] || 0) + Number(t.totalAmount || 0);
      }
    });

    const revenueByTechnician = Object.keys(techMap).map(techName => ({
      name: techName,
      value: parseFloat(techMap[techName].toFixed(2)),
    }));

    // 5. Revenue by Payment Method (payments in period)
    const methodMap: Record<string, number> = {};
    payments.forEach((p) => {
      if (p.type !== "REFUND") {
        const method = p.method || "Other";
        methodMap[method] = (methodMap[method] || 0) + Number(p.amount || 0);
      }
    });

    const revenueByPaymentMethod = Object.keys(methodMap).map(method => ({
      name: method,
      value: parseFloat(methodMap[method].toFixed(2)),
    }));

    return {
      totalInvoiced,
      totalCollected,
      outstanding,
      refunded,
      revenueByPeriod,
      revenueByServiceType,
      revenueByTechnician,
      revenueByPaymentMethod,
    };
  },
};
