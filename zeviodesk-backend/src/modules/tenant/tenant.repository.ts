import { prisma } from "../../config/prisma.js";

export const tenantRepository = {
  findAll: async () => prisma.tenant.findMany({ include: { _count: { select: { users: true } } } }),
  
  findAllWithUsers: async () =>
    prisma.tenant.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "desc" },
    }),

  findAllWithFilters: async (where: any, skip?: number, take?: number) =>
    prisma.tenant.findMany({
      where,
      skip,
      take,
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "desc" },
    }),

  countWithFilters: async (where: any) =>
    prisma.tenant.count({ where }),

  findByIdWithUsers: async (id: string) =>
    prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    }),

  findById: async (id: string) => prisma.tenant.findUnique({ where: { id } }),
  findBySlug: async (slug: string) => prisma.tenant.findUnique({ where: { slug } }),

  createWithAdmin: async (data: any) => {
    return await prisma.$transaction(async (tx) => {
      // Create the tenant
      const tenant = await tx.tenant.create({
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          plan: data.plan || "FREE",
          status: data.status || "ACTIVE",
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
        },
        include: { _count: { select: { users: true } } },
      });
      
      // Create the tenant admin user if email is provided
      if (data.adminEmail) {
        await tx.user.create({
          data: {
            tenantId: tenant.id,
            name: data.adminName || "Tenant Admin",
            email: data.adminEmail,
            password: "", // Will be set via setup token
            phone: data.adminPhone,
            role: "TENANT_ADMIN",
            status: "INACTIVE", // Pending setup
            setupToken: data.setupToken,
            setupTokenExpiry: data.setupTokenExpiry,
          }
        });
      }
      
      return tenant;
    });
  },

  create: async (data: any) =>
    prisma.tenant.create({
      data,
      include: { _count: { select: { users: true } } },
    }),

  update: async (id: string, data: any) =>
    prisma.tenant.update({
      where: { id },
      data,
      include: { _count: { select: { users: true } } },
    }),

  delete: async (id: string) => prisma.tenant.delete({ where: { id } }),
};
