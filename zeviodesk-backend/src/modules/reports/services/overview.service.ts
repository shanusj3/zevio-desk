import { prisma } from "../../../config/prisma.js";

export const overviewService = {
  getOverviewMetrics: async (tenantId: string, startDate: Date, endDate: Date) => {
    // 1. Tickets created in range
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        partsCost: true,
        laborCost: true,
        createdAt: true,
        actualCompletionDate: true,
      },
    });

    const numTickets = tickets.length;
    const completedTickets = tickets.filter(t => t.status === "COMPLETED").length;
    const readyForPickupTickets = tickets.filter(t => t.status === "READY_FOR_PICKUP").length;

    // 2. Average completion time (for tickets completed in selected range)
    const completedTicketsInRange = await prisma.ticket.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        actualCompletionDate: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        actualCompletionDate: true,
      },
    });

    let totalCompletionTimeHrs = 0;
    completedTicketsInRange.forEach((t) => {
      if (t.actualCompletionDate) {
        const diffMs = t.actualCompletionDate.getTime() - t.createdAt.getTime();
        totalCompletionTimeHrs += diffMs / (1000 * 60 * 60);
      }
    });
    const avgCompletionTimeDays = completedTicketsInRange.length > 0
      ? parseFloat(((totalCompletionTimeHrs / completedTicketsInRange.length) / 24).toFixed(1))
      : 0;

    // 3. Average repair value (based on totalAmount of tickets completed or invoiced in range)
    // We can use tickets created in range or finalized invoices in range. Let's base on tickets in range.
    const ticketsWithAmount = tickets.filter(t => t.totalAmount !== null);
    const totalRepairAmt = ticketsWithAmount.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
    const avgRepairValue = ticketsWithAmount.length > 0
      ? parseFloat((totalRepairAmt / ticketsWithAmount.length).toFixed(2))
      : 0;

    // 4. Invoiced Amount (finalized invoices in range)
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

    const invoicedAmount = finalizedInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const taxCollected = finalizedInvoices.reduce((sum, inv) => sum + Number(inv.tax || 0), 0);
    const invoiceSubtotal = invoicedAmount - taxCollected;

    // 5. Collected Amount (payments collected in range)
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        paidAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        type: true,
      },
    });

    const collectedAmount = payments
      .filter(p => p.type !== "REFUND")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const refundedAmount = payments
      .filter(p => p.type === "REFUND")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const netCollected = collectedAmount - refundedAmount;

    // 6. Period Outstanding (finalized in period with balanceDue > 0)
    const periodOutstanding = finalizedInvoices
      .filter(inv => Number(inv.balanceDue || 0) > 0)
      .reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

    // 7. Cumulative Outstanding (all finalized invoices ever with balanceDue > 0)
    const allOutstandingInvoices = await prisma.invoice.findMany({
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

    const cumulativeOutstanding = allOutstandingInvoices.reduce(
      (sum, inv) => sum + Number(inv.balanceDue || 0),
      0
    );

    // 8. Overdue (due date is in the past and balanceDue > 0)
    const now = new Date();
    const overdueAmount = allOutstandingInvoices
      .filter(inv => inv.dueDate && inv.dueDate < now)
      .reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

    // 9. Cost Metrics
    const totalPartsCost = tickets.reduce((sum, t) => sum + Number(t.partsCost || 0), 0);
    const totalLaborCost = tickets.reduce((sum, t) => sum + Number(t.laborCost || 0), 0);

    // 10. Profitability fallback checks
    let estimatedGrossProfit = 0;
    let grossMarginPercent = 0;
    let profitabilityStatus: "FULL" | "CONTRIBUTION" | "UNAVAILABLE" = "FULL";

    const hasPartsCost = tickets.some(t => t.partsCost !== null && Number(t.partsCost) > 0);
    const hasLaborCost = tickets.some(t => t.laborCost !== null && Number(t.laborCost) > 0);

    if (hasPartsCost && hasLaborCost) {
      estimatedGrossProfit = invoiceSubtotal - totalPartsCost - totalLaborCost;
      grossMarginPercent = invoiceSubtotal > 0
        ? parseFloat(((estimatedGrossProfit / invoiceSubtotal) * 100).toFixed(1))
        : 0;
      profitabilityStatus = "FULL";
    } else if (hasPartsCost) {
      estimatedGrossProfit = invoiceSubtotal - totalPartsCost;
      grossMarginPercent = invoiceSubtotal > 0
        ? parseFloat(((estimatedGrossProfit / invoiceSubtotal) * 100).toFixed(1))
        : 0;
      profitabilityStatus = "CONTRIBUTION";
    } else {
      profitabilityStatus = "UNAVAILABLE";
    }

    return {
      invoicedAmount,
      collectedAmount,
      refundedAmount,
      netCollected,
      periodOutstanding,
      cumulativeOutstanding,
      overdueAmount,
      numTickets,
      completedTickets,
      readyForPickupTickets,
      avgRepairValue,
      avgCompletionTimeDays,
      totalPartsCost,
      totalLaborCost,
      invoiceSubtotal,
      estimatedGrossProfit,
      grossMarginPercent,
      profitabilityStatus,
    };
  },
};
