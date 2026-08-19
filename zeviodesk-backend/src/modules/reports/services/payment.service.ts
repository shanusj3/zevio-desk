import { prisma } from "../../../config/prisma.js";

export const paymentService = {
  getPaymentMetrics: async (
    tenantId: string,
    startDate: Date,
    endDate: Date,
    page = 1,
    limit = 10
  ) => {
    // 1. Payments in selected range
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        paidAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        type: true,
        method: true,
      },
    });

    const totalCollected = payments
      .filter(p => p.type !== "REFUND")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const refunds = payments
      .filter(p => p.type === "REFUND")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const netCollected = totalCollected - refunds;

    // 2. Payments grouped by Method
    const methodMap: Record<string, number> = {
      CASH: 0,
      UPI: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
    };
    payments.forEach((p) => {
      if (p.type !== "REFUND") {
        const method = (p.method || "Other").toUpperCase();
        methodMap[method] = (methodMap[method] || 0) + Number(p.amount || 0);
      }
    });

    const byMethod = Object.keys(methodMap).map(method => ({
      name: method,
      value: parseFloat(methodMap[method].toFixed(2)),
    }));

    // 3. Outstanding & Overdue summaries (all finalized invoices with balance due)
    const outstandingInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: "FINALIZED",
        balanceDue: { gt: 0 },
      },
      select: {
        balanceDue: true,
        dueDate: true,
      },
    });

    const outstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

    const now = new Date();
    const overdue = outstandingInvoices
      .filter(inv => inv.dueDate && inv.dueDate < now)
      .reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

    // 4. Paginated Outstanding Invoices
    const skip = (page - 1) * limit;
    const [outstandingInvoicesList, totalOutstandingCount] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          tenantId,
          status: "FINALIZED",
          balanceDue: { gt: 0 },
        },
        include: {
          ticket: {
            select: {
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          invoiceDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: "FINALIZED",
          balanceDue: { gt: 0 },
        },
      }),
    ]);

    const outstandingList = outstandingInvoicesList.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber || "DRAFT",
      customerName: inv.ticket?.customer?.name || "Walk-In Customer",
      dueAmount: Number(inv.balanceDue || 0),
      dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : "-",
      status: now > (inv.dueDate || now) ? "OVERDUE" : "PENDING",
    }));

    return {
      totalCollected,
      refunds,
      netCollected,
      byMethod,
      outstanding,
      overdue,
      outstandingList,
      pagination: {
        total: totalOutstandingCount,
        page,
        limit,
        totalPages: Math.ceil(totalOutstandingCount / limit),
      },
    };
  },
};
