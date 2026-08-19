import { prisma } from "../../config/prisma.js";
import crypto from "crypto";

export const authRepository = {
  findUserByEmail: async (email: string) => {
    return prisma.user.findUnique({ where: { email } });
  },

  findTenantBySlug: async (slug: string) => {
    return prisma.tenant.findUnique({ where: { slug } });
  },

  createUserWithTenant: async (userData: any, tenantName: string, tenantSlug: string) => {
    let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: { name: tenantName, slug: tenantSlug },
      });
    }

    const user = await prisma.user.create({
      data: {
        ...userData,
        tenantId: tenant.id,
      },
    });

    return { user, tenant };
  },

  findUserBySetupToken: async (setupToken: string) => {
    const hashedSetupToken = crypto.createHash("sha256").update(setupToken).digest("hex");
    return prisma.user.findFirst({
      where: {
        setupToken: hashedSetupToken,
        setupTokenExpiry: {
          gt: new Date(),
        },
      },
    });
  },

  updateUser: async (id: string, data: any) => {
    return prisma.user.update({
      where: { id },
      data,
    });
  },
};
