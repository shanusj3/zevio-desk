import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { lineItemController, invoiceController, invoiceSettingsController } from "./invoice.controller.js";

// These routers use mergeParams: true — they are mounted under /:ticketId in ticket.routes.ts
const lineItemRouter = Router({ mergeParams: true });
const invoiceRouter  = Router({ mergeParams: true });

const FINANCE_ROLES   = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"];
const STAFF_WITH_TECH = [...FINANCE_ROLES, "TECHNICIAN"];
const MANAGE_ONLY     = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"];
const ADMIN_ONLY      = ["SUPER_ADMIN", "TENANT_ADMIN"];

// ── Line Item Routes: /tickets/:ticketId/line-items ───────────────────────────
lineItemRouter.use(requireAuth);

lineItemRouter.get(  "/",               requireRole(STAFF_WITH_TECH), lineItemController.list);
lineItemRouter.post( "/",               requireRole(FINANCE_ROLES),   lineItemController.add);
lineItemRouter.put(  "/:lineItemId",    requireRole(FINANCE_ROLES),   lineItemController.update);
lineItemRouter.delete("/:lineItemId",   requireRole(MANAGE_ONLY),     lineItemController.remove);

// ── Invoice Routes: /tickets/:ticketId/invoice ────────────────────────────────
invoiceRouter.use(requireAuth);

invoiceRouter.get(  "/",         requireRole(STAFF_WITH_TECH), invoiceController.get);
invoiceRouter.get(  "/draft",    requireRole(STAFF_WITH_TECH), invoiceController.getDraft);
invoiceRouter.post( "/finalize", requireRole(FINANCE_ROLES),   invoiceController.finalize);
invoiceRouter.post( "/void",     requireRole(MANAGE_ONLY),     invoiceController.void);

// ── Standalone Invoice List: GET /invoices ────────────────────────────────────
const invoiceListRouter = Router();
invoiceListRouter.use(requireAuth);
invoiceListRouter.get("/", requireRole(ADMIN_ONLY), invoiceController.listAll);
invoiceListRouter.get("/:invoiceNumber", requireRole(STAFF_WITH_TECH), invoiceController.getByNumber);

// ── Invoice Settings: /settings/invoicing ─────────────────────────────────────
const invoiceSettingsRouter = Router();
invoiceSettingsRouter.use(requireAuth);
invoiceSettingsRouter.get(   "/", requireRole(ADMIN_ONLY), invoiceSettingsController.get);
invoiceSettingsRouter.patch( "/", requireRole(ADMIN_ONLY), invoiceSettingsController.update);

export { lineItemRouter, invoiceRouter, invoiceListRouter, invoiceSettingsRouter };
