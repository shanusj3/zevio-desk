import { prisma } from "../../../config/prisma.js";

export const profitabilityService = {
  getProfitabilityMetrics: async (tenantId: string, startDate: Date, endDate: Date) => {
    // 1. Fetch finalized invoices in date range to calculate customer-facing revenues
    const finalizedInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: "FINALIZED",
        finalizedAt: { gte: startDate, lte: endDate },
      },
      select: {
        ticketId: true,
        total: true,
        tax: true,
        ticket: {
          select: {
            partsCost: true,
            laborCost: true,
          },
        },
      },
    });

    const totalInvoiced = finalizedInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const taxCollected = finalizedInvoices.reduce((sum, inv) => sum + Number(inv.tax || 0), 0);
    const invoiceSubtotal = totalInvoiced - taxCollected;

    // Fetch line items for finalized invoices in range to get parts/labor revenue split
    const finalizedTicketIds = finalizedInvoices.map(inv => inv.ticketId);
    const lineItems = await prisma.ticketLineItem.findMany({
      where: {
        ticketId: { in: finalizedTicketIds },
      },
      select: {
        type: true,
        subtotal: true,
      },
    });

    const partsRevenue = lineItems
      .filter(item => item.type === "PART")
      .reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

    const serviceRevenue = lineItems
      .filter(item => item.type === "LABOR" || item.type === "SERVICE")
      .reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

    // Sum parts cost and labor cost of tickets finalized in this range
    const partsCost = finalizedInvoices.reduce(
      (sum, inv) => sum + Number(inv.ticket?.partsCost || 0),
      0
    );
    const laborCost = finalizedInvoices.reduce(
      (sum, inv) => sum + Number(inv.ticket?.laborCost || 0),
      0
    );

    // Profitability classification
    let grossProfit = 0;
    let grossMarginPercent = 0;
    let estimatedContribution = 0;
    let profitabilityStatus: "FULL" | "CONTRIBUTION" | "UNAVAILABLE" = "FULL";

    const hasPartsCost = finalizedInvoices.some(
      inv => inv.ticket?.partsCost !== null && Number(inv.ticket.partsCost) > 0
    );
    const hasLaborCost = finalizedInvoices.some(
      inv => inv.ticket?.laborCost !== null && Number(inv.ticket.laborCost) > 0
    );

    if (hasPartsCost && hasLaborCost) {
      grossProfit = invoiceSubtotal - partsCost - laborCost;
      grossMarginPercent = invoiceSubtotal > 0
        ? parseFloat(((grossProfit / invoiceSubtotal) * 100).toFixed(1))
        : 0;
      profitabilityStatus = "FULL";
    } else if (hasPartsCost) {
      estimatedContribution = invoiceSubtotal - partsCost;
      grossMarginPercent = invoiceSubtotal > 0
        ? parseFloat(((estimatedContribution / invoiceSubtotal) * 100).toFixed(1))
        : 0;
      profitabilityStatus = "CONTRIBUTION";
    } else {
      profitabilityStatus = "UNAVAILABLE";
    }

    // 2. Profitability breakdowns (grouped in JS memory)
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        actualCompletionDate: { gte: startDate, lte: endDate },
      },
      select: {
        brand: true,
        itemCategory: true,
        totalAmount: true,
        partsCost: true,
        laborCost: true,
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
    });

    // Brand Profitability
    const brandMap: Record<string, { revenue: number; partsCost: number; laborCost: number }> = {};
    tickets.forEach((t) => {
      const brand = t.brand || "Other";
      if (!brandMap[brand]) {
        brandMap[brand] = { revenue: 0, partsCost: 0, laborCost: 0 };
      }
      brandMap[brand].revenue += Number(t.totalAmount || 0);
      brandMap[brand].partsCost += Number(t.partsCost || 0);
      brandMap[brand].laborCost += Number(t.laborCost || 0);
    });

    const profitabilityByBrand = Object.keys(brandMap).map((brand) => {
      const brandSubtotal = brandMap[brand].revenue; // Approximation before tax
      let profit = 0;
      if (profitabilityStatus === "FULL") {
        profit = brandSubtotal - brandMap[brand].partsCost - brandMap[brand].laborCost;
      } else if (profitabilityStatus === "CONTRIBUTION") {
        profit = brandSubtotal - brandMap[brand].partsCost;
      }
      return {
        name: brand,
        revenue: brandSubtotal,
        profit: parseFloat(profit.toFixed(2)),
        margin: brandSubtotal > 0 ? parseFloat(((profit / brandSubtotal) * 100).toFixed(1)) : 0,
      };
    });

    // Category Profitability
    const catMap: Record<string, { revenue: number; partsCost: number; laborCost: number }> = {};
    tickets.forEach((t) => {
      const cat = t.itemCategory || "Other";
      if (!catMap[cat]) {
        catMap[cat] = { revenue: 0, partsCost: 0, laborCost: 0 };
      }
      catMap[cat].revenue += Number(t.totalAmount || 0);
      catMap[cat].partsCost += Number(t.partsCost || 0);
      catMap[cat].laborCost += Number(t.laborCost || 0);
    });

    const profitabilityByCategory = Object.keys(catMap).map((cat) => {
      const catSubtotal = catMap[cat].revenue;
      let profit = 0;
      if (profitabilityStatus === "FULL") {
        profit = catSubtotal - catMap[cat].partsCost - catMap[cat].laborCost;
      } else if (profitabilityStatus === "CONTRIBUTION") {
        profit = catSubtotal - catMap[cat].partsCost;
      }
      return {
        name: cat,
        revenue: catSubtotal,
        profit: parseFloat(profit.toFixed(2)),
        margin: catSubtotal > 0 ? parseFloat(((profit / catSubtotal) * 100).toFixed(1)) : 0,
      };
    });

    return {
      totalInvoiced,
      taxCollected,
      invoiceSubtotal,
      partsRevenue,
      serviceRevenue,
      partsCost,
      laborCost,
      grossProfit,
      grossMarginPercent,
      estimatedContribution,
      profitabilityStatus,
      profitabilityByBrand,
      profitabilityByCategory,
    };
  },
};
