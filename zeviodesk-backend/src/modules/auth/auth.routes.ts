import { Router } from "express";
import { authController } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});


router.post("/login", loginLimiter, authController.login);
router.get("/verify-setup-token", authController.verifySetupToken);
router.post("/setup-password", authController.setupPassword);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", requireAuth, authController.me);

export default router;


