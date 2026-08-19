import { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router({ mergeParams: true });


const FINANCE_ROLES = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"];
const PAYMENT_READ_ROLES = [...FINANCE_ROLES, "TECHNICIAN"];

router.get("/", requireRole(PAYMENT_READ_ROLES), paymentController.list);
router.post("/", requireRole(FINANCE_ROLES), paymentController.create);
router.delete("/:paymentId", requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"]), paymentController.delete);

export default router;
