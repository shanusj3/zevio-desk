import { Router } from "express";
import { reportsController } from "./reports.controller.js";
import { authMiddleware, roleMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["SUPER_ADMIN"]), reportsController.getPlatformReports);
router.get("/tenant", authMiddleware, roleMiddleware(["TENANT_ADMIN", "MANAGER"]), reportsController.getTenantReports);

export default router;
