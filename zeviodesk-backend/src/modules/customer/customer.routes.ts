import { Router } from "express";
import { customerController } from "./customer.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth);
// Technicians cannot access customers directly
router.use(requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR"]));

router.get("/", customerController.getAll);
router.get("/:id", customerController.getOne);
router.post("/", customerController.create);
router.put("/:id", customerController.update);
router.delete("/:id", customerController.delete);

export default router;
