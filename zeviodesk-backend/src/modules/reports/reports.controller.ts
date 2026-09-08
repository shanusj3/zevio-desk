import { Request, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { reportsService } from "./reports.service.js";
import { CustomRequest } from "../../interfaces/request.interface.js";

export const reportsController = {
  getPlatformReports: asyncHandler(async (req: Request, res: Response) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [usersCount, totalTenants, statusGroups, revenueAgg] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.tenant.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      prisma.payment.aggregate({
        where: {
          paidAt: { gte: thirtyDaysAgo },
          type: { not: "REFUND" },
        },
        _sum: { amount: true },
      }),
    ]);

    let monthlyCreations: { month_date: Date; count: number }[] = [];
    try {
      // Requires PostgreSQL — not compatible with MySQL or SQLite.
      monthlyCreations = await prisma.$queryRaw<{ month_date: Date; count: number }[]>`
        SELECT date_trunc('month', "createdAt") as month_date,
               CAST(COUNT(id) AS INTEGER) as count
        FROM tenants
        WHERE "createdAt" >= current_date - interval '5 months'
        GROUP BY date_trunc('month', "createdAt")
        ORDER BY date_trunc('month', "createdAt") ASC
      `;
    } catch (err: any) {
      throw new Error(`Database query failed: PostgreSQL is required for analytics queries. Details: ${err.message}`);
    }

    let activeCount = 0;
    let inactiveCount = 0;
    statusGroups.forEach((g) => {
      if (g.status === "ACTIVE") activeCount += g._count.id;
      else inactiveCount += g._count.id;
    });

    const revenueLastThirtyDays = revenueAgg._sum.amount
      ? Number(revenueAgg._sum.amount)
      : 0;
    const averageUsersPerTenant = totalTenants > 0 ? usersCount / totalTenants : 0;
    const churnRate = totalTenants > 0 ? (inactiveCount / totalTenants) * 100 : 0;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const growthTrendMap: Record<string, number> = {};

    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      growthTrendMap[months[d.getMonth()]] = 0;
    }

    monthlyCreations.forEach((row) => {
      if (row.month_date) {
        const d = new Date(row.month_date);
        const label = months[d.getMonth()];
        if (growthTrendMap[label] !== undefined) {
          growthTrendMap[label] = Number(row.count);
        }
      }
    });

    const tenantGrowthTrend = Object.keys(growthTrendMap).map((key) => ({
      month: key,
      value: growthTrendMap[key],
    }));

    return sendSuccess(
      res,
      {
        revenueLastThirtyDays,
        averageUsersPerTenant: parseFloat(averageUsersPerTenant.toFixed(1)),
        activeCount,
        inactiveCount,
        totalTenants,
        totalUsers: usersCount,
        churnRate: parseFloat(churnRate.toFixed(1)),
        tenantGrowthTrend,
      },
      "Platform reports fetched successfully"
    );
  }),

  getTenantReports: asyncHandler(async (req: CustomRequest, res: Response) => {
    // 1. Enforce strict tenant isolation by using req.user.tenantId (ignoring any query-supplied tenantId)
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant session is missing or invalid");
    }

    // 2. Parse date filters (calendar date strings like '2026-08-01')
    const { startDate, endDate, timezone = "Asia/Kolkata", page = "1", limit = "10" } = req.query;

    if (!startDate || !endDate) {
      throw new Error("startDate and endDate are required query parameters");
    }

    // 3. Resolve start/end boundaries in local timezone and convert to UTC Dates
    // Defaults to Asia/Kolkata offset (+05:30)
    let offset = "+05:30";
    if (timezone === "UTC") {
      offset = "Z";
    }

    const startUTC = new Date(`${startDate}T00:00:00${offset}`);
    const endUTC = new Date(`${endDate}T23:59:59.999${offset}`);

    if (isNaN(startUTC.getTime()) || isNaN(endUTC.getTime())) {
      throw new Error("Invalid date format. Dates must be valid calendar date strings (YYYY-MM-DD)");
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    // 4. Retrieve reports using reportsService
    const reports = await reportsService.getTenantReports(
      tenantId,
      startUTC,
      endUTC,
      pageNum,
      limitNum
    );

    return sendSuccess(res, reports, "Tenant reports fetched successfully");
  }),

  /**
   * Dedicated endpoint for fast real-time Dashboard Stats
   */
  getDashboardStats: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant session is missing or invalid");
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const [
      openTicketsCount,
      repairCompletedCount,
      readyPickupCount,
      waitingPartsCount,
      deliveredTodayCount,
      inDiagnosisCount,
      inProgressCount,
      newReceivedCount,
      unassignedCount,
      overdueCount,
      todayPaymentsAgg,
      unpaidTicketsAgg,
      lowStockCount,
    ] = await Promise.all([
      prisma.ticket.count({ where: { tenantId, status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] } } }),
      prisma.ticket.count({ where: { tenantId, status: "REPAIR_COMPLETED" } }),
      prisma.ticket.count({ where: { tenantId, status: "READY_FOR_PICKUP" } }),
      prisma.ticket.count({ where: { tenantId, status: "WAITING_FOR_PARTS" } }),
      prisma.ticket.count({ where: { tenantId, status: { in: ["DELIVERED", "COMPLETED"] }, pickupDate: { gte: todayStart } } }),
      prisma.ticket.count({ where: { tenantId, status: "DIAGNOSING" } }),
      prisma.ticket.count({ where: { tenantId, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
      prisma.ticket.count({ where: { tenantId, assignedToId: null, status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] } } }),
      prisma.ticket.count({ where: { tenantId, status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] }, createdAt: { lte: threeDaysAgo } } }),
      prisma.payment.aggregate({
        where: { tenantId, paidAt: { gte: todayStart }, type: { not: "REFUND" } },
        _sum: { amount: true },
      }),
      prisma.ticket.aggregate({
        where: { tenantId, status: { notIn: ["DELIVERED", "COMPLETED", "CANCELLED"] }, paymentStatus: "UNPAID" },
        _sum: { totalAmount: true },
      }),
      prisma.inventoryItem.count({
        where: { tenantId, isActive: true, currentStock: { lte: 2 } },
      }),
    ]);

    const earningsTodayNum = todayPaymentsAgg._sum.amount ? Number(todayPaymentsAgg._sum.amount) : 0;
    const pendingInvoicesNum = unpaidTicketsAgg._sum.totalAmount ? Number(unpaidTicketsAgg._sum.totalAmount) : 0;

    return sendSuccess(
      res,
      {
        openTicketsCount,
        repairCompletedCount,
        readyPickupCount,
        waitingPartsCount,
        deliveredTodayCount,
        earningsTodayVal: `₹${earningsTodayNum.toLocaleString("en-IN")}`,
        earningsTodayNum,
        inDiagnosisCount,
        inProgressCount,
        newReceivedCount,
        unassignedCount,
        overdueCount,
        avgDurationVal: "1.5 Days",
        pendingInvoicesVal: `₹${pendingInvoicesNum.toLocaleString("en-IN")}`,
        pendingInvoicesNum,
        lowStockCount,
      },
      "Dashboard stats retrieved successfully"
    );
  }),

  /**
   * Get user's DB-backed dashboard preferences
   */
  getDashboardPreferences: asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    if (!userId || !tenantId) {
      throw new Error("User session is invalid");
    }

    const prefRecord = await prisma.userDashboardPreference.findUnique({
      where: {
        tenantId_userId: { tenantId, userId },
      },
    });

    const visibleStatIds = prefRecord?.visibleStatIds ? (prefRecord.visibleStatIds as string[]) : null;

    return sendSuccess(
      res,
      {
        visibleStatIds,
      },
      "Dashboard preferences fetched successfully"
    );
  }),

  /**
   * Update user's DB-backed visible stat card configuration
   */
  updateDashboardPreferences: asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    const { visibleStatIds } = req.body;

    if (!userId || !tenantId) {
      throw new Error("User session is invalid");
    }

    if (!Array.isArray(visibleStatIds)) {
      throw new Error("visibleStatIds must be an array of string stat IDs");
    }

    const pref = await prisma.userDashboardPreference.upsert({
      where: {
        tenantId_userId: { tenantId, userId },
      },
      create: {
        userId,
        tenantId,
        visibleStatIds,
      },
      update: {
        visibleStatIds,
      },
    });

    return sendSuccess(res, { visibleStatIds: pref.visibleStatIds }, "Dashboard stat cards updated successfully");
  }),

  /**
   * Update DB-backed table column preferences (visible columns & column order)
   */
  updateTablePreferences: asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    const { tableId = "tickets", visibleColumnIds, columnOrder } = req.body;

    if (!userId || !tenantId) {
      throw new Error("User session is invalid");
    }

    const existing = await prisma.userDashboardPreference.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });

    const currentOrderObj = (existing?.statOrder as any) || {};
    const updatedOrderObj = {
      ...currentOrderObj,
      [tableId]: { visibleColumnIds, columnOrder },
    };

    const pref = await prisma.userDashboardPreference.upsert({
      where: {
        tenantId_userId: { tenantId, userId },
      },
      create: {
        userId,
        tenantId,
        visibleStatIds: [],
        statOrder: updatedOrderObj,
      },
      update: {
        statOrder: updatedOrderObj,
      },
    });

    return sendSuccess(res, pref.statOrder, "Table column preferences saved successfully");
  }),
};
