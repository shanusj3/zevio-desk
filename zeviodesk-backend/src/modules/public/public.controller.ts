import { Response } from "express";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { NotFoundError } from "../../errors/AppError.js";

// These DTOs deliberately whitelist customer-safe fields. Never return the
// Prisma record directly from a public endpoint.
function publicTicketDto(ticket: any) {
  return {
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    device: [ticket.brand, ticket.model].filter(Boolean).join(" ") || ticket.title,
    estimatedCompletion: ticket.estimatedCompletionDate,
    totalAmount: ticket.totalAmount?.toString() ?? null,
  };
}

function publicInvoiceDto(invoice: any) {
  return {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    paymentStatus: invoice.paymentStatus,
    invoiceDate: invoice.invoiceDate,
    total: invoice.total.toString(),
    amountPaid: invoice.amountPaid.toString(),
    balanceDue: invoice.balanceDue.toString(),
  };
}

export const publicController = {
  ticketByToken: asyncHandler(async (req, res: Response) => {
    const ticket = await (prisma.ticket as any).findUnique({ where: { publicToken: req.params.publicToken } });
    if (!ticket) throw new NotFoundError("Ticket");
    return sendSuccess(res, publicTicketDto(ticket), "Ticket tracking details");
  }),

  invoiceByToken: asyncHandler(async (req, res: Response) => {
    const invoice = await (prisma.invoice as any).findUnique({ where: { publicToken: req.params.publicToken } });
    if (!invoice) throw new NotFoundError("Invoice");
    return sendSuccess(res, publicInvoiceDto(invoice), "Invoice tracking details");
  }),

  ticketBySlugAndNumber: asyncHandler(async (req, res: Response) => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: req.params.tenantSlug }, select: { id: true } });
    if (!tenant) throw new NotFoundError("Ticket");
    const ticket = await (prisma.ticket as any).findFirst({
      where: { tenantId: tenant.id, ticketNumber: req.params.ticketNumber },
    });
    if (!ticket) throw new NotFoundError("Ticket");
    return sendSuccess(res, publicTicketDto(ticket), "Ticket tracking details");
  }),

  invoiceBySlugAndNumber: asyncHandler(async (req, res: Response) => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: req.params.tenantSlug }, select: { id: true } });
    if (!tenant) throw new NotFoundError("Invoice");
    const invoice = await prisma.invoice.findFirst({
      where: { tenantId: tenant.id, invoiceNumber: req.params.invoiceNumber },
    });
    if (!invoice) throw new NotFoundError("Invoice");
    return sendSuccess(res, publicInvoiceDto(invoice), "Invoice tracking details");
  }),
};
