import { Router } from "express";
import { ticketController } from "./ticket.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import paymentRoutes from "../payment/payment.routes.js";
import { lineItemRouter, invoiceRouter } from "../invoice/invoice.routes.js";

const router = Router();


router.use(requireAuth);



const STAFF_WITH_TECHNICIAN = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR", "TECHNICIAN"];
const STAFF_NO_TECHNICIAN = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"];
const MANAGE_ONLY = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"];

router.get("/",
  requireRole(STAFF_WITH_TECHNICIAN),
  ticketController.getAll
);
// Must be defined before /:id so static string paths are never treated as dynamic IDs.
router.get("/repair-completed", requireRole(STAFF_NO_TECHNICIAN), ticketController.repairCompleted);
router.get("/ready-for-pickup", requireRole(STAFF_NO_TECHNICIAN), ticketController.readyForPickup);
router.post("/:id/complete-repair", requireRole(STAFF_WITH_TECHNICIAN), ticketController.completeRepair);
router.post("/:id/deliver", requireRole(STAFF_NO_TECHNICIAN), ticketController.deliver);
router.get("/:id",
  requireRole(STAFF_WITH_TECHNICIAN),
  ticketController.getOne
);
router.post("/",
  requireRole(STAFF_NO_TECHNICIAN),
  ticketController.create
);
router.post("/:id/attachments/presign",
  requireRole(STAFF_WITH_TECHNICIAN),
  ticketController.presignAttachment
);
router.put("/:id",
  requireRole(STAFF_WITH_TECHNICIAN),
  ticketController.update
);
router.delete("/:id",
  requireRole(MANAGE_ONLY),
  ticketController.delete
);


router.use("/:ticketId/payments",    paymentRoutes);
router.use("/:ticketId/line-items",  lineItemRouter);
router.use("/:ticketId/invoice",     invoiceRouter);

export default router;
