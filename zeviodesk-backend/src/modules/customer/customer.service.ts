import { customerRepository } from "./customer.repository.js";
import { CreateCustomerDto, UpdateCustomerDto } from "./customer.types.js";
import { NotFoundError, ValidationError } from "../../errors/AppError.js";

export const customerService = {
  getCustomers: async (filters: { tenantId?: string; search?: string; alphabet?: string; page?: number; limit?: number } = {}) => {
    const { tenantId, search, alphabet, page = 1, limit = 15 } = filters;
    const skip = (page - 1) * limit;
    const where: any = tenantId ? { tenantId } : {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (alphabet && alphabet !== "All") where.name = { startsWith: alphabet, mode: "insensitive" };

    const [customers, total] = await Promise.all([
      customerRepository.findAllWithFilters(where, skip, limit),
      customerRepository.countWithFilters(where),
    ]);
    return { customers, total, hasMore: skip + customers.length < total, page, limit };
  },

  getCustomerById: async (id: string) => {
    const cust = await customerRepository.findById(id);
    if (!cust) throw new NotFoundError("Customer not found");
    return cust;
  },

  createCustomer: async (dto: CreateCustomerDto) => {
    if (!dto.tenantId) throw new ValidationError("Tenant ID is required");
    if (!dto.name?.trim()) throw new ValidationError("Customer name is required");

    return customerRepository.create({
      tenantId: dto.tenantId,
      name: dto.name.trim(),
      email: dto.email?.trim() || null,
      phone: dto.phone?.trim() || null,
      whatsappId: dto.whatsappId || dto.phone?.replace(/\D/g, "") || null,
      address: dto.address?.trim() || null,
      customerType: dto.customerType || "WALK_IN",
      notes: dto.notes?.trim() || null,
    });
  },

  updateCustomer: async (id: string, dto: UpdateCustomerDto) => {
    // tenantId must never be updated through normal CRUD — strip it defensively
    const { tenantId: _ignored, ...safeDto } = dto as any;
    return customerRepository.update(id, safeDto);
  },

  deleteCustomer: async (id: string) => customerRepository.delete(id),
};


