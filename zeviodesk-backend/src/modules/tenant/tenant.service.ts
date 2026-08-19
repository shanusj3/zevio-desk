import crypto from "crypto";
import { tenantRepository } from "./tenant.repository.js";
import { generateSlug } from "../../utils/generateSlug.js";
import { activityService } from "../../services/activity.service.js";
import { generateTenantLogoPresign } from "../../services/s3-upload.service.js";
import { TenantStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { ValidationError, NotFoundError } from "../../errors/AppError.js";

export const tenantService = {
  getTenants: async (filters: {
    search?: string;
    status?: string;
    alphabet?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const { search, status, alphabet, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { adminName: { contains: search, mode: "insensitive" } },
        { businessEmail: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (status && status !== "All") {
      if (status === "Active") {
        where.status = TenantStatus.ACTIVE;
      } else if (status === "Inactive") {
        where.status = TenantStatus.SUSPENDED;
      } else if (status === "Pending") {
        where.status = TenantStatus.PENDING;
      }
    }
    
    if (alphabet && alphabet !== "All") {
      where.name = { startsWith: alphabet, mode: "insensitive" };
    }

    const [tenants, total] = await Promise.all([
      tenantRepository.findAllWithFilters(where, skip, limit),
      tenantRepository.countWithFilters(where)
    ]);
    
    return {
      tenants: tenants.map(formatTenant),
      total,
      hasMore: skip + tenants.length < total,
      page,
      limit
    };
  },

  getTenantById: async (id: string) => {
    const tenant = await tenantRepository.findByIdWithUsers(id);
    if (!tenant) return null;
    return formatTenant(tenant);
  },

  createTenant: async (dto: any) => {
    const slug = dto.subdomain
      ? generateSlug(dto.subdomain)
      : generateSlug(dto.name);

    // Check slug uniqueness
    const existing = await tenantRepository.findBySlug(slug);
    if (existing) throw new ValidationError(`Subdomain "${slug}" is already taken`);

    // Check admin email uniqueness across all users
    if (dto.adminEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: dto.adminEmail } });
      if (existingUser) {
        throw new ValidationError(`Admin email "${dto.adminEmail}" is already in use by another account.`);
      }
    }

    // Generate setup token for the shop admin
    const setupToken = crypto.randomBytes(32).toString("hex");
    const hashedSetupToken = crypto.createHash("sha256").update(setupToken).digest("hex");
    const setupTokenExpiry = new Date();
    setupTokenExpiry.setHours(setupTokenExpiry.getHours() + 48); // 48 hours validity

    const tenant = await tenantRepository.createWithAdmin({
      id: dto.id,
      name: dto.name,
      slug,
      plan: dto.plan || "FREE",
      status: TenantStatus.PENDING,
      description: dto.description,
      businessEmail: dto.businessEmail,
      phone: dto.phone,
      address: dto.address,
      gstNumber: dto.gstNumber,
      primaryColor: dto.primaryColor || "#7C3AED",
      secondaryColor: dto.secondaryColor || "#F59E0B",
      adminName: dto.adminName,
      adminEmail: dto.adminEmail,
      adminPhone: dto.adminPhone,
      logoUrl: dto.logoUrl,
      setupToken: hashedSetupToken,
      setupTokenExpiry,
    });

    await activityService.log(
      "Tenant created",
      `Tenant "${dto.name}" created`,
      tenant.id
    );

    // Send setup email to Shop Admin
    // ⚠️ Email failures are non-fatal: the tenant is already created.
    // The emailSent flag is returned so the SUPER_ADMIN dashboard can surface a warning.
    let emailSent = false;
    if (dto.adminEmail) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      let setupLink = "";
      try {
        const url = new URL(frontendUrl);
        url.hostname = `${slug}.${url.hostname}`;
        url.pathname = "/setup-password";
        url.searchParams.set("token", setupToken);
        setupLink = url.toString();
      } catch (err) {
        setupLink = `${frontendUrl}/setup-password?token=${setupToken}`;
      }

      try {
        const { emailService } = await import("../../services/email.service.js");
        emailSent = await emailService.sendSetupPasswordEmail(
          dto.adminEmail,
          dto.adminName || "Tenant Admin",
          setupLink
        );
        if (!emailSent) {
          logger.warn(
            `[TenantService] Setup email silently failed for ${dto.adminEmail} (tenant: ${tenant.id}). ` +
            `Manual invite required. Setup link: ${setupLink}`
          );
        }
      } catch (emailErr: any) {
        logger.error(
          `[TenantService] Exception while sending setup email to ${dto.adminEmail} (tenant: ${tenant.id}): ${emailErr?.message}`,
          { stack: emailErr?.stack }
        );
      }
    }

    return { ...formatTenant(tenant), emailSent };
  },

  updateTenant: async (id: string, data: any) => {
    const updated = await tenantRepository.update(id, {
      name: data.name,
      plan: data.plan,
      status: data.status,
      // extra fields stored as JSON in metadata (see repository)
      description: data.description,
      businessEmail: data.businessEmail,
      phone: data.phone,
      address: data.address,
      gstNumber: data.gstNumber,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      adminName: data.adminName,
      adminEmail: data.adminEmail,
      adminPhone: data.adminPhone,
      logoUrl: data.logoUrl,
    });

    await activityService.log(
      "Tenant updated",
      `Tenant "${updated.name}" updated`,
      id
    );

    return formatTenant(updated);
  },

  toggleStatus: async (id: string) => {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError("Tenant not found");

    const newStatus = tenant.status === TenantStatus.ACTIVE ? TenantStatus.SUSPENDED : TenantStatus.ACTIVE;
    const updated = await tenantRepository.update(id, { status: newStatus });

    await activityService.log(
      "Tenant status changed",
      `Tenant "${updated.name}" status set to ${newStatus}`,
      id
    );

    return formatTenant(updated);
  },

  deleteTenant: async (id: string) => {
    const tenant = await tenantRepository.findById(id);
    await tenantRepository.delete(id);
    await activityService.log(
      "Tenant deleted",
      `Tenant "${tenant?.name}" deleted`,
      undefined
    );
  },

  generateLogoPresignedUrl: async (tenantId: string, contentType: string) => {
    return generateTenantLogoPresign(tenantId, contentType);
  },
};

// Maps Prisma Tenant to the shape expected by the frontend
function formatTenant(tenant: any) {
  const usersCount = tenant._count?.users ?? tenant.users?.length ?? 0;
  // Map ACTIVE/SUSPENDED/PENDING to frontend labels
  const statusMap: Record<string, string> = {
    ACTIVE: "Active",
    SUSPENDED: "Inactive",
    PENDING: "Pending",
  };

  return {
    id: tenant.id,
    name: tenant.name,
    description: tenant.description || "",
    subdomain: tenant.slug,
    businessEmail: tenant.businessEmail || "",
    phone: tenant.phone || "",
    gstNumber: tenant.gstNumber || "",
    address: tenant.address || "",
    primaryColor: tenant.primaryColor || "#7C3AED",
    secondaryColor: tenant.secondaryColor || "#F59E0B",
    adminName: tenant.adminName || "",
    adminEmail: tenant.adminEmail || "",
    adminPhone: tenant.adminPhone || "",
    usersCount,
    status: statusMap[tenant.status] ?? "Active",
    plan: tenant.plan || "FREE",
    monthlyRevenue: tenant.monthlyRevenue || "$0",
    logoUrl: tenant.logoUrl || null,
    createdAt: formatDate(tenant.createdAt),
    updatedAt: formatDateTime(tenant.updatedAt),
  };
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${formatDate(d)}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
