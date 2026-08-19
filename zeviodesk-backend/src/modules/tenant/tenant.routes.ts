import { Router } from "express";
import { tenantController } from "./tenant.controller.js";
import { requireAuth, requireRole, requireTenantAccess } from "../auth/auth.middleware.js";

const router = Router();

// SUPER_ADMIN-only: list and create tenants
router.get("/", requireAuth, requireRole(["SUPER_ADMIN"]), tenantController.getAll);
router.post("/", requireAuth, requireRole(["SUPER_ADMIN"]), tenantController.create);

// SUPER_ADMIN can access any tenant; TENANT_ADMIN/MANAGER can only access their own
router.get("/:id",
  requireAuth,
  requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"]),
  requireTenantAccess(),
  tenantController.getOne
);
router.put("/:id",
  requireAuth,
  requireRole(["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"]),
  requireTenantAccess(),
  tenantController.update
);

// SUPER_ADMIN-only: status toggle and deletion
router.patch("/:id/status", requireAuth, requireRole(["SUPER_ADMIN"]), tenantController.toggleStatus);
router.delete("/:id", requireAuth, requireRole(["SUPER_ADMIN"]), tenantController.delete);

// Logo presign: scoped to own tenant only
router.post("/:id/logo/presign",
  requireAuth,
  requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]),
  requireTenantAccess(),
  tenantController.getPresignedUrl
);

export default router;
