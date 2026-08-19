import { Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { CustomRequest } from "../../interfaces/request.interface.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { lineItemService, invoiceService } from "./invoice.service.js";
import { UnauthorizedError, ValidationError } from "../../errors/AppError.js";
import { prisma } from "../../config/prisma.js";

// ─── Line Item Controller ─────────────────────────────────────────────────────
export const lineItemController = {
  list: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await lineItemService.list(req.params.ticketId, req.tenantId);
    return sendSuccess(res, data, "Line items retrieved");
  }),

  add: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await lineItemService.add(req.params.ticketId, req.body, req.tenantId);
    return sendSuccess(res, data, "Line item added", 201);
  }),

  update: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await lineItemService.update(
      req.params.ticketId,
      req.params.lineItemId,
      req.body,
      req.tenantId
    );
    return sendSuccess(res, data, "Line item updated");
  }),

  remove: asyncHandler(async (req: CustomRequest, res: Response) => {
    const data = await lineItemService.remove(
      req.params.ticketId,
      req.params.lineItemId,
      req.tenantId
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
    const tenantId = req.tenantId;
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
        logoUrl: tenant?.logoUrl ?? "",
        description: tenant?.description ?? "",
      },
      "Invoicing settings retrieved"
    );
  }),

  /** PATCH /settings/invoicing — update tenant invoicing settings & shop details */
  update: asyncHandler(async (req: CustomRequest, res: Response) => {
    const tenantId = req.tenantId;
    if (!tenantId) throw new UnauthorizedError("Tenant context missing");

    const { defaultInvoiceDetailLevel, name, businessEmail, phone, address, gstNumber, logoUrl, description } = req.body;

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
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (description !== undefined) updateData.description = description;

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
      },
    });
    return sendSuccess(res, updated, "Invoicing settings updated");
  }),
};
