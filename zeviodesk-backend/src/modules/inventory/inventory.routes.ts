import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { inventoryController } from "./inventory.controller.js";

const router = Router();
router.use(requireAuth);

// Roles
const MANAGE   = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"];
const ALL_STAFF = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "ADVISOR", "TECHNICIAN"];
const ADMIN_ONLY = ["SUPER_ADMIN", "TENANT_ADMIN"];

// Settings toggle (enable/disable inventory per tenant)
router.patch("/settings", requireRole(ADMIN_ONLY), inventoryController.toggleEnabled);

// Search (used by PartSearchCombo — fast endpoint)
router.get("/search",      requireRole(ALL_STAFF), inventoryController.search);
router.get("/categories",  requireRole(ALL_STAFF), inventoryController.categories);
router.post("/categories", requireRole(MANAGE),    inventoryController.createCategory);
router.put("/categories/rename", requireRole(MANAGE), inventoryController.renameCategory);
router.delete("/categories/:name", requireRole(MANAGE), inventoryController.deleteCategory);

// CRUD
router.get(  "/",          requireRole(ALL_STAFF), inventoryController.list);
router.post( "/",          requireRole(MANAGE),    inventoryController.create);
router.get(  "/:id",       requireRole(ALL_STAFF), inventoryController.getOne);
router.patch("/:id",       requireRole(MANAGE),    inventoryController.update);
router.delete("/:id",      requireRole(MANAGE),    inventoryController.deactivate);

// Stock operations
router.post("/:id/adjust",      requireRole(MANAGE),    inventoryController.adjustStock);
router.get( "/:id/movements",   requireRole(ALL_STAFF), inventoryController.getMovements);

export { router as inventoryRoutes };
