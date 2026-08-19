import { overviewService } from "./services/overview.service.js";
import { revenueService } from "./services/revenue.service.js";
import { ticketService } from "./services/ticket.service.js";
import { paymentService } from "./services/payment.service.js";
import { technicianService } from "./services/technician.service.js";
import { inventoryService } from "./services/inventory.service.js";
import { profitabilityService } from "./services/profitability.service.js";

export const reportsService = {
  getTenantReports: async (
    tenantId: string,
    startDate: Date,
    endDate: Date,
    page = 1,
    limit = 10
  ) => {
    const [
      overview,
      revenue,
      tickets,
      payments,
      technicians,
      inventory,
      profitability,
    ] = await Promise.all([
      overviewService.getOverviewMetrics(tenantId, startDate, endDate),
      revenueService.getRevenueMetrics(tenantId, startDate, endDate),
      ticketService.getTicketMetrics(tenantId, startDate, endDate),
      paymentService.getPaymentMetrics(tenantId, startDate, endDate, page, limit),
      technicianService.getTechnicianMetrics(tenantId, startDate, endDate),
      inventoryService.getInventoryMetrics(tenantId, startDate, endDate),
      profitabilityService.getProfitabilityMetrics(tenantId, startDate, endDate),
    ]);

    return {
      overview,
      revenue,
      tickets,
      payments,
      technicians,
      inventory,
      profitability,
    };
  },
};
