import { Response } from "express";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { NotFoundError } from "../../errors/AppError.js";
import { getPublicUrl } from "../../services/s3-upload.service.js";

const LIFECYCLE_STAGE_MAP: Record<string, string> = {
  RECEIVED: "RECEIVED",
  DIAGNOSING: "INSPECTION",
  AWAITING_APPROVAL: "INSPECTION",
  IN_PROGRESS: "IN_REPAIR",
  WAITING_FOR_PARTS: "IN_REPAIR",
  REWORK: "IN_REPAIR",
  QUALITY_CHECK: "QUALITY_CHECK",
  READY_FOR_PICKUP: "READY",
  COMPLETED: "READY",
  DELIVERED: "READY",
  CLOSED: "READY",
  CANCELLED: "CANCELLED",
};

const CUSTOMER_LABEL_MAP: Record<string, string> = {
  RECEIVED: "Device Received",
  DIAGNOSING: "Inspection in Progress",
  AWAITING_APPROVAL: "Pending Estimate Approval",
  IN_PROGRESS: "Repair in Progress",
  WAITING_FOR_PARTS: "Waiting for Replacement Part",
  REWORK: "Re-testing & Adjustment",
  QUALITY_CHECK: "Final Quality Check",
  READY_FOR_PICKUP: "Ready for Pickup",
  COMPLETED: "Completed & Ready",
  DELIVERED: "Delivered & Completed",
  CANCELLED: "Service Cancelled",
};

function maskSerial(serial?: string | null): string | null {
  if (!serial || serial.trim().length === 0) return null;
  const s = serial.trim();
  if (s.length <= 4) return s;
  return `••••${s.slice(-4)}`;
}

function buildPublicTicketDto(ticket: any, tenant: any, payments: any[], statusHistory: any[]) {
  const showEstimate = ticket.showEstimate ?? true;
  const showParts = ticket.showPartsBreakdown ?? true;
  const showAdvance = ticket.showAdvancePaid ?? true;
  const showBalance = ticket.showBalanceDue ?? true;
  const maskSerialFlag = ticket.showSerialMasked ?? true;

  const totalPaidNum = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const totalAmountNum = Number(ticket.totalAmount || ticket.estimatedCost || 0);
  const advanceNum = Number(ticket.advanceDeposit || 0);
  const balanceNum = Math.max(0, totalAmountNum - totalPaidNum);

  // Attachments & intake photos
  let intakePhotos: string[] = [];
  if (Array.isArray(ticket.attachments)) {
    intakePhotos = ticket.attachments
      .filter((a: any) => a && (a.stage === "intake" || a.type === "photo"))
      .map((a: any) => a.url);
  }
  if (intakePhotos.length === 0 && Array.isArray(ticket.photos)) {
    intakePhotos = ticket.photos;
  }

  // Map status history entries
  const historyFeed = (statusHistory || []).map((h: any) => ({
    id: h.id,
    status: h.status,
    statusLabel: CUSTOMER_LABEL_MAP[h.status] || h.status,
    customerNote: h.customerNote || null,
    createdAt: h.createdAt,
  }));

  // If statusHistory is empty, fallback with initial status
  if (historyFeed.length === 0) {
    historyFeed.push({
      id: "initial",
      status: ticket.status,
      statusLabel: CUSTOMER_LABEL_MAP[ticket.status] || ticket.status,
      customerNote: "Ticket created and device received at repair center.",
      createdAt: ticket.createdAt,
    });
  }

  return {
    ticketNumber: ticket.ticketNumber || ticket.jobNumber,
    trackingToken: ticket.trackingToken || ticket.publicToken,
    trackingEnabled: ticket.trackingEnabled ?? true,
    currentStatus: ticket.status,
    statusLabel: CUSTOMER_LABEL_MAP[ticket.status] || ticket.status,
    lifecycleStage: LIFECYCLE_STAGE_MAP[ticket.status] || "IN_REPAIR",
    updatedAt: ticket.updatedAt,
    createdAt: ticket.createdAt,

    device: {
      brand: ticket.brand || null,
      model: ticket.model || null,
      itemCategory: ticket.itemCategory || null,
      title: [ticket.brand, ticket.model].filter(Boolean).join(" ") || ticket.title,
      serialNumber: maskSerialFlag ? maskSerial(ticket.serialNumber) : ticket.serialNumber || null,
      itemCondition: ticket.itemCondition || null,
      accessories: ticket.accessories || null,
    },

    reportedIssue: ticket.reportedIssue || ticket.description,
    estimatedCompletionDate: ticket.estimatedCompletionDate,

    shop: {
      name: tenant?.name || tenant?.adminName || "ZevioDesk Repair Center",
      logo: tenant?.logoUrl ? getPublicUrl(tenant.logoUrl) : null,
      phone: tenant?.phone || tenant?.adminPhone || null,
      address: tenant?.address || null,
      whatsapp: tenant?.whatsappConfig?.phoneNumber || tenant?.phone || null,
      primaryColor: tenant?.primaryColor || "#116dff",
    },

    statusHistory: historyFeed,
    intakePhotos,

    financials: {
      showEstimate,
      showParts,
      showAdvance,
      showBalance,
      estimatedCost: showEstimate ? totalAmountNum : null,
      advancePaid: showAdvance ? (totalPaidNum || advanceNum) : null,
      balanceDue: showBalance ? balanceNum : null,
      partsRequired: showParts && Array.isArray(ticket.partsRequired) ? ticket.partsRequired : [],
    },
  };
}

export const publicController = {
  ticketByToken: asyncHandler(async (req, res: Response) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "no-referrer");

    const token = req.params.publicToken;
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { trackingToken: token },
          { publicToken: token },
          { id: token },
          { ticketNumber: token },
          { jobNumber: token },
        ],
      },
      include: {
        tenant: {
          include: {
            whatsappConfig: true,
          },
        },
        payments: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError("Tracking Link Unavailable or Invalid Token");
    }

    if (ticket.trackingEnabled === false) {
      throw new NotFoundError("Tracking for this ticket has been disabled by the repair center");
    }

    const dto = buildPublicTicketDto(ticket, ticket.tenant, ticket.payments || [], ticket.statusHistory || []);
    return sendSuccess(res, dto, "Ticket tracking details");
  }),

  invoiceByToken: asyncHandler(async (req, res: Response) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "no-referrer");

    const invoice = await (prisma.invoice as any).findFirst({
      where: {
        OR: [{ publicToken: req.params.publicToken }],
      },
    });
    if (!invoice) throw new NotFoundError("Invoice");
    return sendSuccess(res, invoice, "Invoice tracking details");
  }),

  ticketBySlugAndNumber: asyncHandler(async (req, res: Response) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "no-referrer");

    const tenant = await prisma.tenant.findUnique({
      where: { slug: req.params.tenantSlug },
      include: { whatsappConfig: true },
    });
    if (!tenant) throw new NotFoundError("Ticket");

    const ticket = await prisma.ticket.findFirst({
      where: { tenantId: tenant.id, ticketNumber: req.params.ticketNumber },
      include: {
        payments: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!ticket || ticket.trackingEnabled === false) throw new NotFoundError("Ticket");

    const dto = buildPublicTicketDto(ticket, tenant, ticket.payments || [], ticket.statusHistory || []);
    return sendSuccess(res, dto, "Ticket tracking details");
  }),

  invoiceBySlugAndNumber: asyncHandler(async (req, res: Response) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "no-referrer");

    const tenant = await prisma.tenant.findUnique({ where: { slug: req.params.tenantSlug }, select: { id: true } });
    if (!tenant) throw new NotFoundError("Invoice");
    const invoice = await prisma.invoice.findFirst({
      where: { tenantId: tenant.id, invoiceNumber: req.params.invoiceNumber },
    });
    if (!invoice) throw new NotFoundError("Invoice");
    return sendSuccess(res, invoice, "Invoice tracking details");
  }),

  tenantInfoBySlug: asyncHandler(async (req, res: Response) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Referrer-Policy", "no-referrer");

    const slug = req.params.slug || (req.query.slug as string);
    if (!slug) throw new NotFoundError("Tenant");

    const tenant = await prisma.tenant.findFirst({
      where: { slug: slug.toLowerCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!tenant) throw new NotFoundError("Tenant");

    return sendSuccess(res, {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: getPublicUrl(tenant.logoUrl),
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
    }, "Tenant public info");
  }),
};
