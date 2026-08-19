import { prisma } from "../../config/prisma.js";

export const customerRepository = {
  findAllWithFilters: async (where: any, skip: number, take: number) =>
    prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
  countWithFilters: async (where: any) => prisma.customer.count({ where }),
  findById: async (id: string) => prisma.customer.findUnique({ where: { id } }),
  create: async (data: any) => prisma.customer.create({ data }),
  update: async (id: string, data: any) => prisma.customer.update({ where: { id }, data }),
  delete: async (id: string) => prisma.customer.delete({ where: { id } }),
};