import { Router } from "express";
import { authRoutes } from "../modules/auth/index.js";
import { userRoutes } from "../modules/user/index.js";
import { tenantRoutes } from "../modules/tenant/index.js";
import { ticketRoutes } from "../modules/ticket/index.js";
import { customerRoutes } from "../modules/customer/index.js";
import { whatsappRoutes } from "../modules/whatsapp/index.js";
import { reportsRoutes } from "../modules/reports/index.js";
import { catalogRoutes } from "../modules/catalog/index.js";
import { invoiceListRouter, invoiceSettingsRouter } from "../modules/invoice/invoice.routes.js";
import publicRoutes from "../modules/public/public.routes.js";
import { logsBuffer } from "../config/logger.js";
import { runReminderJob } from "../jobs/reminder.job.js";
import { runCleanupJob } from "../jobs/cleanup.job.js";
import { sendSuccess } from "../utils/response.js";

import { requireAuth, requireRole } from "../modules/auth/auth.middleware.js";

const apiRouter = Router();

// Health Check
apiRouter.get("/health", (req, res) => {
  sendSuccess(res, {
    uptime: process.uptime(),
    service: "Enterprise-NodeJS-Backend",
    version: "1.0.0",
  }, "Service is healthy");
});

// Module API Endpoints
apiRouter.use("/auth", authRoutes);
// Deliberately unauthenticated; handlers expose only public DTOs.
apiRouter.use("/public", publicRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/tenants", tenantRoutes);
apiRouter.use("/tickets", ticketRoutes);
apiRouter.use("/customers", customerRoutes);
apiRouter.use("/whatsapp", whatsappRoutes);
apiRouter.use("/reports", reportsRoutes);
apiRouter.use("/catalog", requireAuth, catalogRoutes);
apiRouter.use("/invoices", invoiceListRouter);
apiRouter.use("/settings/invoicing", invoiceSettingsRouter);

// System Logs Endpoint for Dashboard Monitor
apiRouter.get("/system/logs", requireAuth, requireRole(["SUPER_ADMIN"]), (req, res) => {
  sendSuccess(res, logsBuffer, "Live system logs retrieved");
});

// Trigger Jobs
apiRouter.post("/jobs/reminder", requireAuth, requireRole(["SUPER_ADMIN"]), (req, res) => {
  const result = runReminderJob();
  sendSuccess(res, result, "Reminder background job executed");
});

apiRouter.post("/jobs/cleanup", requireAuth, requireRole(["SUPER_ADMIN"]), (req, res) => {
  const result = runCleanupJob();
  sendSuccess(res, result, "Cleanup background job executed");
});

export default apiRouter;
