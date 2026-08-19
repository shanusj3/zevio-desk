import { Request, Response } from "express";
import { tenantService } from "./tenant.service.js";
import { sendSuccess } from "../../utils/response.js";
import { validateTenantPayload } from "./tenant.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ValidationError, NotFoundError } from "../../errors/AppError.js";

export const tenantController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { search, status, alphabet, page, limit } = req.query;

    const filters = {
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      alphabet: alphabet ? String(alphabet) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 10,
    };

    const result = await tenantService.getTenants(filters);
    return sendSuccess(res, result, "Tenants retrieved");
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantService.getTenantById(req.params.id);
    if (!tenant) throw new NotFoundError("Tenant");
    return sendSuccess(res, tenant, "Tenant details");
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const err = validateTenantPayload(req.body);
    if (err) throw new ValidationError(err);

    const tenant = await tenantService.createTenant(req.body);
    return sendSuccess(res, tenant, "Tenant created", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const err = validateTenantPayload(req.body, true);
    if (err) throw new ValidationError(err);

    const updated = await tenantService.updateTenant(req.params.id, req.body);
    return sendSuccess(res, updated, "Tenant updated");
  }),

  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    const updated = await tenantService.toggleStatus(req.params.id);
    return sendSuccess(res, updated, "Tenant status toggled");
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await tenantService.deleteTenant(req.params.id);
    return sendSuccess(res, { id: req.params.id }, "Tenant deleted");
  }),

  getPresignedUrl: asyncHandler(async (req: Request, res: Response) => {
    const { contentType } = req.body;
    const tenantId = req.params.id;
    if (!contentType) throw new ValidationError("contentType is required");

    const presigned = await tenantService.generateLogoPresignedUrl(tenantId, contentType);
    return sendSuccess(res, presigned, "Presigned URL generated");
  }),
};
