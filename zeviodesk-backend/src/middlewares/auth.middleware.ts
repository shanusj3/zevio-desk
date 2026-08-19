import { Response, NextFunction } from "express";
import { CustomRequest } from "../interfaces/request.interface.js";
import { jwtService } from "../services/jwt.service.js";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../config/constants.js";
import { prisma } from "../config/prisma.js";

export async function authMiddleware(req: CustomRequest, res: Response, next: NextFunction) {
  try {
    let token = req.cookies.zevio_token;

    // Fallback to Bearer token for mobile app or external integrations
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, "Authorization token required", HTTP_STATUS.UNAUTHORIZED);
    }
    const payload = jwtService.verify(token);

    // Check user and tenant status from DB to ensure they aren't revoked
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { tenant: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return sendError(res, "User account is suspended or inactive", HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.tenantId && user.tenant && user.tenant.status !== "ACTIVE") {
      return sendError(res, "Tenant account is suspended or inactive", HTTP_STATUS.UNAUTHORIZED);
    }

    // Use live DB values for tenantId and role — the payload may be stale
    // (e.g. user was moved to a different tenant or their role changed after
    // the JWT was issued). The DB record was already fetched above, so reuse it.
    req.user = {
      ...payload,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
    };
    req.tenantId = user.tenantId;

    next();
  } catch (err: any) {
    return sendError(res, err.message || "Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
  }
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, `Forbidden: insufficient permissions (Role was ${req.user?.role}, Allowed: ${allowedRoles.join(",")})`, HTTP_STATUS.FORBIDDEN, "FORBIDDEN");
    }
    next();
  };
}

/**
 * Ensures that non-SUPER_ADMIN callers can only access resources belonging to
 * their own tenant. Reads the resource's tenant from `req.params[paramName]`
 * and compares it to the JWT-derived `req.tenantId`.
 *
 * @param paramName - route param that holds the tenant ID (default: "id")
 */
export function requireTenantAccess(paramName = "id") {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === "SUPER_ADMIN") return next();
    const resourceTenantId = req.params[paramName];
    if (!resourceTenantId || resourceTenantId !== req.tenantId) {
      return sendError(res, "Forbidden: you can only access your own tenant's resources", HTTP_STATUS.FORBIDDEN);
    }
    next();
  };
}
