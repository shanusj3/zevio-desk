import { Router } from "express";
import { userController } from "./user.controller.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth);

const STAFF_ROLES = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR", "TECHNICIAN"];
const MANAGE_ROLES = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"];

router.get("/", requireRole(STAFF_ROLES), userController.getAll);
router.get("/:id", requireRole(STAFF_ROLES), userController.getOne);
router.post("/", requireRole(MANAGE_ROLES), userController.create);
router.put("/:id", requireRole(MANAGE_ROLES), userController.update);
router.delete("/:id", requireRole(MANAGE_ROLES), userController.delete);

export default router;
