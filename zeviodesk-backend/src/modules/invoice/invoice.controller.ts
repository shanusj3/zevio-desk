import { Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { lineItemService, invoiceService } from "./invoice.service.js";
import { UnauthorizedError, ValidationError } from "../../errors/AppError.js";
import { prisma } from "../../config/prisma.js";
import { getPublicUrl, extractObjectKey } from "../../services/s3-upload.service.js";

// ─── Line Item Controller ─────────────────────────────────────────────────────
export const lineItemController = {
  list: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await lineItemService.list(req.params.ticketId, req.tenantId);
    return sendSuccess(res, data, "Line items retrieved");
  }),

  add: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await lineItemService.add(req.params.ticketId, req.body, req.tenantId, req.user?.id);
    return sendSuccess(res, data, "Line item added", 201);
  }),

  update: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await lineItemService.update(
      req.params.ticketId,
      req.params.lineItemId,
      req.body,
      req.tenantId,
      req.user?.id
    );
    return sendSuccess(res, data, "Line item updated");
  }),

  remove: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await lineItemService.remove(
      req.params.ticketId,
      req.params.lineItemId,
      req.tenantId,
      req.user?.id
    );
    return sendSuccess(res, data, "Line item removed");
  }),
};

// ─── Invoice Controller ───────────────────────────────────────────────────────
export const invoiceController = {
  /** GET /tickets/:ticketId/invoice — returns live draft or finalized invoice */
  get: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await invoiceService.getForTicket(req.params.ticketId, req.tenantId);
    return sendSuccess(res, data, "Invoice retrieved");
  }),

  /** GET /tickets/:ticketId/invoice/draft — live recalculation */
  getDraft: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await invoiceService.getDraftSummary(req.params.ticketId, req.tenantId);
    return sendSuccess(res, data, "Invoice draft summary");
  }),

  /** POST /tickets/:ticketId/invoice/finalize */
  finalize: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await invoiceService.finalize(
      req.params.ticketId,
      req.body,
      req.tenantId,
      req.user?.id
    );
    return sendSuccess(res, data, "Invoice finalized", 200);
  }),

  /** POST /tickets/:ticketId/invoice/void */
  void: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await invoiceService.void(
      req.params.ticketId,
      req.body,
      req.tenantId,
      req.user?.id
    );
    return sendSuccess(res, data, "Invoice voided");
  }),

  /** GET /invoices — list all invoices for tenant with filters */
  listAll: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const { paymentStatus, q } = req.query as { paymentStatus?: string; q?: string };

    const where: any = { tenantId };
    if (paymentStatus && paymentStatus !== "ALL") {
      where.paymentStatus = paymentStatus;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        ticket: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            brand: true,
            model: true,
            customer: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    // Apply text search filter in memory (name, phone, invoice number, job number)
    let result = invoices;
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      result = invoices.filter((inv) => {
        const customerName = inv.ticket?.customer?.name?.toLowerCase() ?? "";
        const phone = inv.ticket?.customer?.phone?.toLowerCase() ?? "";
        const invNum = (inv.invoiceNumber ?? "").toLowerCase();
        const jobNum = (inv.ticket?.jobNumber ?? "").toLowerCase();
        return (
          customerName.includes(term) ||
          phone.includes(term) ||
          invNum.includes(term) ||
          jobNum.includes(term)
        );
      });
    }

    return sendSuccess(res, result, "Invoices retrieved");
  }),

  getByNumber: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");
    const data = await invoiceService.getByNumber(req.params.invoiceNumber, tenantId);
    return sendSuccess(res, data, "Invoice retrieved");
  }),
};

// ─── Invoice Settings Controller ──────────────────────────────────────────────
export const invoiceSettingsController = {
  /** GET /settings/invoicing — get tenant invoicing settings & branding details */
  get: asyncHandler(async (req: CustomRequest, res: Response) => {
    let tenantId = req.tenantId;

    // Fallback lookup if caller is SUPER_ADMIN or URL has ?tenant=slug query parameter
    if (!tenantId) {
      const slug = (req.query.tenant as string) || (req.headers['x-tenant-slug'] as string);
      if (slug) {
        const found = await prisma.tenant.findFirst({ where: { slug: slug.toLowerCase() } });
        if (found) tenantId = found.id;
      }
      if (!tenantId) {
        // Fallback to first active tenant for super admin preview
        const first = await prisma.tenant.findFirst({ where: { status: "ACTIVE" } });
        if (first) tenantId = first.id;
      }
    }

    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        defaultInvoiceDetailLevel: true,
        name: true,
        businessEmail: true,
        phone: true,
        address: true,
        gstNumber: true,
        logoUrl: true,
        description: true,
        inventoryEnabled: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    return sendSuccess(
      res,
      {
        defaultInvoiceDetailLevel: tenant?.defaultInvoiceDetailLevel ?? "STANDARD",
        name: tenant?.name ?? "",
        businessEmail: tenant?.businessEmail ?? "",
        phone: tenant?.phone ?? "",
        address: tenant?.address ?? "",
        gstNumber: tenant?.gstNumber ?? "",
        logoUrl: getPublicUrl(tenant?.logoUrl),
        description: tenant?.description ?? "",
        inventoryEnabled: tenant?.inventoryEnabled ?? false,
        primaryColor: tenant?.primaryColor || "#7C3AED",
        secondaryColor: tenant?.secondaryColor || "#F59E0B",
      },
      "Invoicing settings retrieved"
    );
  }),

  /** PATCH /settings/invoicing — update tenant invoicing settings & shop details */
  update: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const { defaultInvoiceDetailLevel, name, businessEmail, phone, address, gstNumber, logoUrl, description, inventoryEnabled, primaryColor, secondaryColor } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;

    if (businessEmail !== undefined && businessEmail !== null && businessEmail.trim() !== '') {
      const emailList = businessEmail.split(',').map((e: string) => e.trim()).filter(Boolean);
      for (const email of emailList) {
        if (!emailRegex.test(email)) {
          throw new ValidationError(`Invalid business email format: '${email}'`);
        }
      }
    }

    if (phone !== undefined && phone !== null && phone.trim() !== '') {
      const phoneList = phone.split(',').map((p: string) => p.trim()).filter(Boolean);
      for (const ph of phoneList) {
        if (!phoneRegex.test(ph)) {
          throw new ValidationError(`Invalid phone number format: '${ph}'`);
        }
      }
    }

    const updateData: any = {};
    if (defaultInvoiceDetailLevel) {
      const allowed = ["MINIMAL", "STANDARD", "DETAILED"];
      if (allowed.includes(defaultInvoiceDetailLevel)) {
        updateData.defaultInvoiceDetailLevel = defaultInvoiceDetailLevel;
      }
    }
    if (name !== undefined) updateData.name = name;
    if (businessEmail !== undefined) updateData.businessEmail = businessEmail;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl ? extractObjectKey(logoUrl) : null;
    if (description !== undefined) updateData.description = description;
    if (inventoryEnabled !== undefined) updateData.inventoryEnabled = inventoryEnabled;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor;

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      select: {
        defaultInvoiceDetailLevel: true,
        name: true,
        businessEmail: true,
        phone: true,
        address: true,
        gstNumber: true,
        logoUrl: true,
        description: true,
        inventoryEnabled: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });
    return sendSuccess(
      res,
      {
        ...updated,
        logoUrl: getPublicUrl(updated.logoUrl),
        primaryColor: updated.primaryColor ?? "#116dff",
        secondaryColor: updated.secondaryColor ?? "#F59E0B",
      },
      "Invoicing settings updated"
    );
  }),
};
