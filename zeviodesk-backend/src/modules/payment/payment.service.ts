import { prisma } from "../../config/prisma.js";
import { paymentRepository } from "./payment.repository.js";
import { CreatePaymentDto } from "./payment.types.js";
import { NotFoundError, ValidationError } from "../../errors/AppError.js";
import {
  computeAmountPaid,
  computePaymentStatus,
  computeTicketTotal,
  enrichTicketWithPaymentSummary,
} from "./payment.utils.js";
import { computeNetPaid } from "../../services/billing.service.js";
import { Decimal } from "@prisma/client/runtime/library";

async function recomputeTicketPaymentStatus(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { payments: true, lineItems: true },
  });
  if (!ticket) throw new NotFoundError("Ticket not found");

  const dbInvoice = await prisma.invoice.findUnique({ where: { ticketId } });

  const allPayments = ticket.payments;
  const amountPaid = computeNetPaid(allPayments);

  let totalBill = new Decimal(0);
  if (dbInvoice) {
    totalBill = new Decimal(dbInvoice.total.toString());
  } else if (ticket.lineItems.length > 0) {
    let sub = new Decimal(0);
    let tax = new Decimal(0);
    for (const li of ticket.lineItems) {
      sub = sub.add(new Decimal(li.subtotal.toString()));
      tax = tax.add(new Decimal(li.taxAmount.toString()));
    }
    totalBill = sub.add(tax);
  } else {
    totalBill = new Decimal((ticket.totalAmount ?? 0).toString());
  }

  const balanceDue = Decimal.max(0, totalBill.sub(amountPaid));
  const paymentStatus = balanceDue.lte(0) ? "PAID"
                        : amountPaid.gt(0) ? "PARTIAL"
                        : "UNPAID";

  const advanceDeposit = allPayments
    .filter((p) => p.type === "ADVANCE")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      paymentStatus,
      advanceDeposit: advanceDeposit || null,
    },
  });

  if (dbInvoice) {
    const invPaymentStatus = paymentStatus === "PAID" ? "PAID"
                             : paymentStatus === "PARTIAL" ? "PARTIALLY_PAID"
                             : "UNPAID";
    await prisma.invoice.update({
      where: { id: dbInvoice.id },
      data: {
        amountPaid,
        balanceDue,
        paymentStatus: invPaymentStatus,
      },
    });
  }
}

export const paymentService = {
  listPayments: async (ticketId: string, tenantId?: string) => {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError("Ticket not found");
    if (tenantId && ticket.tenantId !== tenantId) {
      throw new NotFoundError("Ticket not found");
    }

    return paymentRepository.findByTicketId(ticketId);
  },

  createPayment: async (
    ticketId: string,
    dto: CreatePaymentDto,
    tenantId?: string,
    recordedById?: string
  ) => {
    if (!dto.amount || dto.amount <= 0) {
      throw new ValidationError("Payment amount must be greater than zero");
    }
    if (!dto.type) throw new ValidationError("Payment type is required");

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError("Ticket not found");
    if (tenantId && ticket.tenantId !== tenantId) {
      throw new NotFoundError("Ticket not found");
    }

    if (ticket.status === "COMPLETED" || ticket.status === "DELIVERED" || ticket.status === "CANCELLED") {
      throw new ValidationError("This ticket is completed/delivered and locked. Recording payments is not allowed.");
    }

    return prisma.$transaction(async (tx) => {
      const dbInvoice = await tx.invoice.findUnique({ where: { ticketId } });
      if (dbInvoice && (dbInvoice.status === "VOID" || dbInvoice.status === "PAID")) {
        throw new ValidationError("Cannot record payments against a voided or fully paid invoice.");
      }

      // Recompute exact bill totals & balance due server-side
      const ticketWithLines = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { lineItems: true },
      });

      let totalBill = new Decimal(0);
      if (dbInvoice) {
        totalBill = new Decimal(dbInvoice.total.toString());
      } else if (ticketWithLines && ticketWithLines.lineItems.length > 0) {
        let sub = new Decimal(0);
        let tax = new Decimal(0);
        for (const li of ticketWithLines.lineItems) {
          sub = sub.add(new Decimal(li.subtotal.toString()));
          tax = tax.add(new Decimal(li.taxAmount.toString()));
        }
        totalBill = sub.add(tax);
      } else {
        totalBill = new Decimal((ticket.totalAmount ?? 0).toString());
      }

      const existingPayments = await tx.payment.findMany({ where: { ticketId } });
      const currentPaid = computeNetPaid(existingPayments);
      const currentBalanceDue = Decimal.max(0, totalBill.sub(currentPaid));

      // Server-side validation: payment amount cannot exceed remaining balance due
      if (totalBill.gt(0) && new Decimal(dto.amount).gt(currentBalanceDue.add(0.01))) {
        throw new ValidationError(
          `Payment amount (₹${dto.amount}) exceeds current invoice balance due (₹${currentBalanceDue.toFixed(2)}).`
        );
      }

      const payment = await tx.payment.create({
        data: {
          ticketId,
          tenantId: ticket.tenantId,
          amount: dto.amount,
          type: dto.type,
          method: dto.method || null,
          notes: dto.notes || null,
          reference: dto.reference || null,
          recordedById: recordedById || null,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          invoiceId: dbInvoice ? dbInvoice.id : null,
        }
      });

      const allPayments = await tx.payment.findMany({ where: { ticketId } });
      const amountPaid = computeNetPaid(allPayments);

      const balanceDue = Decimal.max(0, totalBill.sub(amountPaid));
      const paymentStatus = balanceDue.lte(0) ? "PAID"
                            : amountPaid.gt(0) ? "PARTIAL"
                            : "UNPAID";

      const advanceDeposit = allPayments
        .filter((p) => p.type === "ADVANCE")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          paymentStatus,
          advanceDeposit: advanceDeposit || null,
        },
      });

      if (dbInvoice) {
        const invPaymentStatus = paymentStatus === "PAID" ? "PAID"
                                 : paymentStatus === "PARTIAL" ? "PARTIALLY_PAID"
                                 : "UNPAID";
        await tx.invoice.update({
          where: { id: dbInvoice.id },
          data: {
            amountPaid,
            balanceDue,
            paymentStatus: invPaymentStatus,
          },
        });
      }

      return payment;
    });
  },

  deletePayment: async (
    ticketId: string,
    paymentId: string,
    tenantId?: string
  ) => {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError("Ticket not found");
    if (tenantId && ticket.tenantId !== tenantId) {
      throw new NotFoundError("Ticket not found");
    }

    const payment = await paymentRepository.findById(paymentId);
    if (!payment || payment.ticketId !== ticketId) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (invoice && invoice.status === "FINALIZED") {
        throw new ValidationError("Cannot delete a payment linked to a finalized invoice. Create a refund or adjustment instead.");
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: paymentId } });
      
      const allPayments = await tx.payment.findMany({ where: { ticketId } });
      const amountPaid = computeNetPaid(allPayments);

      const dbInvoice = await tx.invoice.findUnique({ where: { ticketId } });

      let totalBill = new Decimal(0);
      if (dbInvoice) {
        totalBill = new Decimal(dbInvoice.total.toString());
      } else {
        const ticketWithLines = await tx.ticket.findUnique({
          where: { id: ticketId },
          include: { lineItems: true },
        });
        if (ticketWithLines && ticketWithLines.lineItems.length > 0) {
          let sub = new Decimal(0);
          let tax = new Decimal(0);
          for (const li of ticketWithLines.lineItems) {
            sub = sub.add(new Decimal(li.subtotal.toString()));
            tax = tax.add(new Decimal(li.taxAmount.toString()));
          }
          totalBill = sub.add(tax);
        } else {
          totalBill = new Decimal((ticket.totalAmount ?? 0).toString());
        }
      }

      const balanceDue = Decimal.max(0, totalBill.sub(amountPaid));
      const paymentStatus = balanceDue.lte(0) ? "PAID"
                            : amountPaid.gt(0) ? "PARTIAL"
                            : "UNPAID";

      const advanceDeposit = allPayments
        .filter((p) => p.type === "ADVANCE")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          paymentStatus,
          advanceDeposit: advanceDeposit || null,
        },
      });

      if (dbInvoice) {
        const invPaymentStatus = paymentStatus === "PAID" ? "PAID"
                                 : paymentStatus === "PARTIAL" ? "PARTIALLY_PAID"
                                 : "UNPAID";
        await tx.invoice.update({
          where: { id: dbInvoice.id },
          data: {
            amountPaid,
            balanceDue,
            paymentStatus: invPaymentStatus,
          },
        });
      }
    });
    
    return { id: paymentId };
  },

  recomputeTicketPaymentStatus,

  enrichTicketWithPaymentSummary,
};
