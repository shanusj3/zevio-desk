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
};
