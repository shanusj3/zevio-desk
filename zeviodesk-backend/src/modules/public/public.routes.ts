import { Router } from "express";
import { publicController } from "./public.controller.js";

const router = Router();

router.get("/tenant/info", publicController.tenantInfoBySlug);
router.get("/tenant/:slug", publicController.tenantInfoBySlug);
router.get("/tickets/:publicToken", publicController.ticketByToken);
router.get("/invoices/:publicToken", publicController.invoiceByToken);
router.get("/:tenantSlug/tickets/:ticketNumber", publicController.ticketBySlugAndNumber);
router.get("/:tenantSlug/invoices/:invoiceNumber", publicController.invoiceBySlugAndNumber);

export default router;
