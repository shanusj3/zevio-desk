import { Response } from "express";
import { customerService } from "./customer.service.js";
import { sendSuccess } from "../../utils/response.js";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ForbiddenError, NotFoundError } from "../../errors/AppError.js";

export const customerController = {
  getAll: asyncHandler(async (req: CustomRequest, res: Response) => {
    const customers = await customerService.getCustomers({
      tenantId: req.tenantId,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      alphabet: typeof req.query.alphabet === "string" ? req.query.alphabet : undefined,
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 15,
    });
    return sendSuccess(res, customers, "Customers list");
  }),

  getOne: asyncHandler(async (req: CustomRequest, res: Response) => {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) throw new NotFoundError("Customer");
    if (req.user?.role !== "SUPER_ADMIN" && customer.tenantId !== req.tenantId) {
      throw new ForbiddenError();
    }
    return sendSuccess(res, customer, "Customer profile");
  }),

  create: asyncHandler(async (req: CustomRequest, res: Response) => {
    const customer = await customerService.createCustomer({
      ...req.body,
      tenantId: req.tenantId || req.body.tenantId,
    });
    return sendSuccess(res, customer, "Customer created", 201);
  }),

  update: asyncHandler(async (req: CustomRequest, res: Response) => {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) throw new NotFoundError("Customer");
    if (req.user?.role !== "SUPER_ADMIN" && customer.tenantId !== req.tenantId) {
      throw new ForbiddenError();
    }
    const updated = await customerService.updateCustomer(req.params.id, req.body);
    return sendSuccess(res, updated, "Customer updated");
  }),

  delete: asyncHandler(async (req: CustomRequest, res: Response) => {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) throw new NotFoundError("Customer");
    if (req.user?.role !== "SUPER_ADMIN" && customer.tenantId !== req.tenantId) {
      throw new ForbiddenError();
    }
    await customerService.deleteCustomer(req.params.id);
    return sendSuccess(res, { id: req.params.id }, "Customer deleted");
  }),
};
