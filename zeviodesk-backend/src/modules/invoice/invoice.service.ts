import { prisma } from "../../config/prisma.js";
import { NotFoundError, ValidationError } from "../../errors/AppError.js";
import {
  calculateLineItem,
  calculateInvoiceTotals,
  assertInvoiceNotFinalized,
  computeNetPaid,
  CalculatedLineItem,
} from "../../services/billing.service.js";
import { lineItemRepository, invoiceRepository } from "./invoice.repository.js";
import {
  CreateLineItemDto,
  UpdateLineItemDto,
  FinalizeInvoiceDto,
  VoidInvoiceDto,
} from "./invoice.types.js";
import { Decimal } from "@prisma/client/runtime/library";
import { randomBytes } from "crypto";
import { stockMovementService } from "../inventory/stock-movement.service.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function requireTicket(ticketId: string, tenantId?: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new NotFoundError("Ticket not found");
  if (tenantId && ticket.tenantId !== tenantId) throw new NotFoundError("Ticket not found");
  return ticket;
}

// ─── Line Item Service ────────────────────────────────────────────────────────
export const lineItemService = {
  list: async (ticketId: string, tenantId?: string) => {
    await requireTicket(ticketId, tenantId);
    return lineItemRepository.findByTicketId(ticketId);
  },

  add: async (ticketId: string, dto: CreateLineItemDto, tenantId?: string, userId?: string) => {
    const ticket = await requireTicket(ticketId, tenantId);
    await assertInvoiceNotFinalized(ticketId);

    const calc = calculateLineItem(dto);

    // If inventory-linked: run inside a transaction to atomically save line item + consume stock.
    // If manual (inventoryItemId is null/undefined): plain insert, no stock logic.
    if (dto.inventoryItemId) {
      return prisma.$transaction(async (tx) => {
        const lineItem = await (tx as any).ticketLineItem.create({
          data: {
            ticketId,
            tenantId:        ticket.tenantId,
            type:            calc.type,
            description:     calc.description,
            quantity:        calc.quantity,
            unitPrice:       calc.unitPrice,
            unitCost:        dto.unitCost ?? null,
            inventoryItemId: dto.inventoryItemId,
            discountAmount:  calc.discountAmount,
            subtotal:        calc.subtotal,
            taxMode:         calc.taxMode,
            taxRate:         calc.taxRate,
            taxAmount:       calc.taxAmount,
            lineTotal:       calc.lineTotal,
            warrantyEnabled:   calc.warrantyEnabled,
            warrantyDuration:  calc.warrantyDuration,
            warrantyUnit:      calc.warrantyUnit,
            warrantyCoverage:  calc.warrantyCoverage,
            warrantyStartDate: calc.warrantyStartDate,
            warrantyEndDate:   calc.warrantyEndDate,
          },
        });

        // Consume stock — negative stock is allowed (shows as warning in UI)
        await stockMovementService.consumeStock(tx, {
          tenantId:        ticket.tenantId,
          inventoryItemId: dto.inventoryItemId!,
          quantity:        Number(calc.quantity),
          ticketLineItemId: lineItem.id,
          reference:       ticket.ticketNumber || ticket.jobNumber || undefined,
          createdById:     userId,
        });

        return lineItem;
      });
    }

    // Manual part — plain insert, no stock interaction
    return lineItemRepository.create({
      ticketId,
      tenantId:        ticket.tenantId,
      type:            calc.type,
      description:     calc.description,
      quantity:        calc.quantity,
      unitPrice:       calc.unitPrice,
      unitCost:        dto.unitCost ?? null,
      inventoryItemId: null,
      discountAmount:  calc.discountAmount,
      subtotal:        calc.subtotal,
      taxMode:         calc.taxMode,
      taxRate:         calc.taxRate,
      taxAmount:       calc.taxAmount,
      lineTotal:       calc.lineTotal,
      // Warranty snapshot
      warrantyEnabled:   calc.warrantyEnabled,
      warrantyDuration:  calc.warrantyDuration,
      warrantyUnit:      calc.warrantyUnit,
      warrantyCoverage:  calc.warrantyCoverage,
      warrantyStartDate: calc.warrantyStartDate,
      warrantyEndDate:   calc.warrantyEndDate,
    });
  },

  update: async (
    ticketId: string,
    lineItemId: string,
    dto: UpdateLineItemDto,
    tenantId?: string,
    userId?: string
  ) => {
    const ticket = await requireTicket(ticketId, tenantId);
    await assertInvoiceNotFinalized(ticketId);

    const existing = await lineItemRepository.findById(lineItemId);
    if (!existing || existing.ticketId !== ticketId) throw new NotFoundError("Line item not found");

    // Merge existing values with dto overrides
    const merged: CreateLineItemDto = {
      type:          (dto.type ?? existing.type) as any,
      description:   dto.description ?? existing.description,
      quantity:      Number(dto.quantity ?? existing.quantity),
      unitPrice:     Number(dto.unitPrice ?? existing.unitPrice),
      unitCost:      dto.unitCost ?? (existing as any).unitCost ?? undefined,
      inventoryItemId: (existing as any).inventoryItemId ?? undefined,
      discountAmount: Number(dto.discountAmount ?? existing.discountAmount ?? 0),
      taxMode:       (dto.taxMode ?? existing.taxMode ?? "NONE") as any,
      taxRate:       Number(dto.taxRate ?? existing.taxRate ?? 0),
      warrantyEnabled:  dto.warrantyEnabled ?? existing.warrantyEnabled,
      warrantyDuration: dto.warrantyDuration ?? existing.warrantyDuration ?? undefined,
      warrantyUnit:     (dto.warrantyUnit ?? existing.warrantyUnit ?? undefined) as any,
      warrantyCoverage: dto.warrantyCoverage ?? existing.warrantyCoverage ?? undefined,
      warrantyStartDate: dto.warrantyStartDate ?? existing.warrantyStartDate?.toISOString() ?? undefined,
      warrantyEndDate:   dto.warrantyEndDate ?? existing.warrantyEndDate?.toISOString() ?? undefined,
    };

    const calc = calculateLineItem(merged);
    const inventoryItemId = (existing as any).inventoryItemId as string | null;

    // If inventory-linked and quantity changed: adjust stock by delta
    if (inventoryItemId) {
      const existingQty = Number(existing.quantity);
      const newQty      = Number(calc.quantity);

      return prisma.$transaction(async (tx) => {
        const updated = await (tx as any).ticketLineItem.update({
          where: { id: lineItemId },
          data: {
            type:            calc.type,
            description:     calc.description,
            quantity:        calc.quantity,
            unitPrice:       calc.unitPrice,
            unitCost:        merged.unitCost ?? null,
            discountAmount:  calc.discountAmount,
            subtotal:        calc.subtotal,
            taxMode:         calc.taxMode,
            taxRate:         calc.taxRate,
            taxAmount:       calc.taxAmount,
            lineTotal:       calc.lineTotal,
            warrantyEnabled:   calc.warrantyEnabled,
            warrantyDuration:  calc.warrantyDuration,
            warrantyUnit:      calc.warrantyUnit,
            warrantyCoverage:  calc.warrantyCoverage,
            warrantyStartDate: calc.warrantyStartDate,
            warrantyEndDate:   calc.warrantyEndDate,
          },
        });

        // Only adjust stock if quantity actually changed
        if (existingQty !== newQty) {
          await stockMovementService.adjustByDelta(tx, {
            tenantId:        ticket.tenantId,
            inventoryItemId,
            existingQuantity: existingQty,
            newQuantity:      newQty,
            ticketLineItemId: lineItemId,
            reference:        ticket.ticketNumber || ticket.jobNumber || undefined,
            createdById:      userId,
          });
        }

        return updated;
      });
    }

    // Manual part — plain update, no stock interaction
    return lineItemRepository.update(lineItemId, {
      type:           calc.type,
      description:    calc.description,
      quantity:       calc.quantity,
      unitPrice:      calc.unitPrice,
      unitCost:       merged.unitCost ?? null,
      discountAmount: calc.discountAmount,
      subtotal:       calc.subtotal,
      taxMode:        calc.taxMode,
      taxRate:        calc.taxRate,
      taxAmount:      calc.taxAmount,
      lineTotal:      calc.lineTotal,
      warrantyEnabled:   calc.warrantyEnabled,
      warrantyDuration:  calc.warrantyDuration,
      warrantyUnit:      calc.warrantyUnit,
      warrantyCoverage:  calc.warrantyCoverage,
      warrantyStartDate: calc.warrantyStartDate,
      warrantyEndDate:   calc.warrantyEndDate,
    });
  },

  remove: async (ticketId: string, lineItemId: string, tenantId?: string, userId?: string) => {
    const ticket = await requireTicket(ticketId, tenantId);
    await assertInvoiceNotFinalized(ticketId);

    const existing = await lineItemRepository.findById(lineItemId);
    if (!existing || existing.ticketId !== ticketId) throw new NotFoundError("Line item not found");

    const inventoryItemId = (existing as any).inventoryItemId as string | null;

    return prisma.$transaction(async (tx) => {
      // 1. Delete associated payment intake records if this part had payments recorded
      const descLower = existing.description.toLowerCase();
      const relatedPayments = await tx.payment.findMany({
        where: { ticketId, type: "PARTS" },
      });

      const partLineItems = await tx.ticketLineItem.findMany({
        where: { ticketId, type: "PART" },
      });

      let matchingPayments = relatedPayments.filter((p) => {
        if (!p.notes) return false;
        const noteLower = p.notes.toLowerCase();
        return (
          noteLower.includes(descLower) ||
          descLower.includes(noteLower.replace("part payment:", "").trim())
        );
      });

      // Fallback: If 1 part payment and 1 part line item on the ticket
      if (matchingPayments.length === 0 && relatedPayments.length > 0 && partLineItems.length === 1) {
        matchingPayments = relatedPayments;
      }

      for (const p of matchingPayments) {
        await tx.payment.delete({ where: { id: p.id } });
      }

      // 2. Delete the line item
      await (tx as any).ticketLineItem.delete({ where: { id: lineItemId } });

      // 3. Return stock if inventory linked
      if (inventoryItemId) {
        await stockMovementService.returnStock(tx, {
          tenantId:        ticket.tenantId,
          inventoryItemId,
          quantity:        Number(existing.quantity),
          ticketLineItemId: lineItemId,
          reference:       ticket.ticketNumber || ticket.jobNumber || undefined,
          reason:          "Part removed from ticket",
          createdById:     userId,
        });
      }

      // 4. Recalculate invoice / ticket payment totals if invoice exists
      const allRemainingPayments = await tx.payment.findMany({ where: { ticketId } });
      const amountPaid = computeNetPaid(allRemainingPayments);
      const dbInvoice = await tx.invoice.findUnique({ where: { ticketId } });
      if (dbInvoice) {
        const balanceDue = Decimal.max(0, dbInvoice.total.minus(amountPaid));
        let pStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
        if (amountPaid.greaterThanOrEqualTo(dbInvoice.total) && dbInvoice.total.greaterThan(0)) {
          pStatus = "PAID";
        } else if (amountPaid.greaterThan(0)) {
          pStatus = "PARTIAL";
        }
        await tx.invoice.update({
          where: { id: dbInvoice.id },
          data: { amountPaid, balanceDue, paymentStatus: pStatus },
        });
      }

      return { id: lineItemId, deletedPaymentsCount: matchingPayments.length };
    });
  },
};

// ─── Invoice Service ──────────────────────────────────────────────────────────
export const invoiceService = {
  /** Get or create a DRAFT invoice and compute live totals */
  getDraftSummary: async (ticketId: string, tenantId?: string) => {
    const ticket = await requireTicket(ticketId, tenantId);
    const lineItems = await lineItemRepository.findByTicketId(ticketId);

    // Compute totals live from DB records
    const calcs: CalculatedLineItem[] = lineItems.map((li) => ({
      type:           li.type as any,
      description:    li.description,
      quantity:       new Decimal(li.quantity.toString()),
      unitPrice:      new Decimal(li.unitPrice.toString()),
      discountAmount: new Decimal((li.discountAmount ?? 0).toString()),
      subtotal:       new Decimal(li.subtotal.toString()),
      taxMode:        (li.taxMode ?? "NONE") as any,
      taxRate:        new Decimal((li.taxRate ?? 0).toString()),
      taxAmount:      new Decimal(li.taxAmount.toString()),
      lineTotal:      new Decimal(li.lineTotal.toString()),
      warrantyEnabled:   li.warrantyEnabled,
      warrantyDuration:  li.warrantyDuration,
      warrantyUnit:      li.warrantyUnit,
      warrantyCoverage:  li.warrantyCoverage,
      warrantyStartDate: li.warrantyStartDate,
      warrantyEndDate:   li.warrantyEndDate,
    }));

    // Pull existing payments for this ticket to show running balance
    const payments = await prisma.payment.findMany({ where: { ticketId } });
    const amountPaid = computeNetPaid(payments);
    const totals = calculateInvoiceTotals(calcs, amountPaid);

    return {
      ticket: { id: ticket.id, status: ticket.status },
      lineItems,
      totals: {
        subtotal:      totals.subtotal.toFixed(2),
        discount:      totals.discount.toFixed(2),
        taxableAmount: totals.taxableAmount.toFixed(2),
        tax:           totals.tax.toFixed(2),
        total:         totals.total.toFixed(2),
        amountPaid:    totals.amountPaid.toFixed(2),
        balanceDue:    totals.balanceDue.toFixed(2),
      },
    };
  },

  /** Atomically finalize an invoice — immutable from this point on */
  finalize: async (ticketId: string, dto: FinalizeInvoiceDto, tenantId?: string, userId?: string) => {
    const ticket = await requireTicket(ticketId, tenantId);

    // Snapshot the tenant's current default template level onto this invoice
    const tenantSettings = await prisma.tenant.findUnique({
      where: { id: ticket.tenantId },
      select: { defaultInvoiceDetailLevel: true },
    });
    const detailLevel = tenantSettings?.defaultInvoiceDetailLevel ?? "STANDARD";

    return prisma.$transaction(async (tx) => {
      // 1. Ensure no existing FINALIZED invoice
      const existing = await tx.invoice.findUnique({ where: { ticketId } });
      if (existing?.status === "FINALIZED") {
        throw new ValidationError("Invoice is already finalized");
      }

      // 2. Load line items inside the transaction
      const lineItems = await tx.ticketLineItem.findMany({ where: { ticketId } });
      if (lineItems.length === 0) {
        throw new ValidationError("Cannot finalize an invoice with no line items");
      }

      // 3. Recalculate totals authoritatively from DB records
      const calcs: CalculatedLineItem[] = lineItems.map((li) => ({
        type:           li.type as any,
        description:    li.description,
        quantity:       new Decimal(li.quantity.toString()),
        unitPrice:      new Decimal(li.unitPrice.toString()),
        discountAmount: new Decimal((li.discountAmount ?? 0).toString()),
        subtotal:       new Decimal(li.subtotal.toString()),
        taxMode:        (li.taxMode ?? "NONE") as any,
        taxRate:        new Decimal((li.taxRate ?? 0).toString()),
        taxAmount:      new Decimal(li.taxAmount.toString()),
        lineTotal:      new Decimal(li.lineTotal.toString()),
        warrantyEnabled:   li.warrantyEnabled,
        warrantyDuration:  li.warrantyDuration,
        warrantyUnit:      li.warrantyUnit,
        warrantyCoverage:  li.warrantyCoverage,
        warrantyStartDate: li.warrantyStartDate,
        warrantyEndDate:   li.warrantyEndDate,
      }));

      // 4. Compute payment totals
      const payments = await tx.payment.findMany({ where: { ticketId } });
      const amountPaid = computeNetPaid(payments);
      const totals = calculateInvoiceTotals(calcs, amountPaid);

      // 5. Determine payment status
      const paymentStatus =
        totals.balanceDue.lte(0) ? "PAID"
        : amountPaid.gt(0) ? "PARTIALLY_PAID"
        : "UNPAID";

      // 6. Build snapshot of line items for the invoice
      const lineItemsSnapshot = lineItems.map((li) => ({
        id:          li.id,
        type:        li.type,
        description: li.description,
        quantity:    li.quantity.toString(),
        unitPrice:   li.unitPrice.toString(),
        discount:    li.discountAmount?.toString() ?? "0",
        subtotal:    li.subtotal.toString(),
        taxMode:     li.taxMode,
        taxRate:     li.taxRate?.toString() ?? "0",
        taxAmount:   li.taxAmount.toString(),
        lineTotal:   li.lineTotal.toString(),
        warranty: li.warrantyEnabled ? {
          duration: li.warrantyDuration,
          unit:     li.warrantyUnit,
          coverage: li.warrantyCoverage,
          start:    li.warrantyStartDate,
          end:      li.warrantyEndDate,
        } : null,
      }));

      // 7. Generate invoice number
      const year = new Date().getFullYear();
      // Atomic increment, keyed by tenant and year. The composite database
      // constraint remains the final protection against duplicate numbers.
      const sequence = await (tx as any).invoiceSequence.upsert({
        where: { tenantId_year: { tenantId: ticket.tenantId, year } },
        create: { tenantId: ticket.tenantId, year, invoiceSequence: 1 },
        update: { invoiceSequence: { increment: 1 } },
      });
      const invoiceNumber = `INV-${year}-${String(sequence.invoiceSequence).padStart(4, "0")}`;

      // 8. Upsert the invoice
      const invoice = existing
        ? await tx.invoice.update({
            where: { id: existing.id },
            data: {
              status:            "FINALIZED",
              invoiceNumber,
              detailLevel,
              subtotal:          totals.subtotal,
              discount:          totals.discount,
              tax:               totals.tax,
              total:             totals.total,
              amountPaid:        totals.amountPaid,
              balanceDue:        totals.balanceDue,
              paymentStatus,
              lineItemsSnapshot: lineItemsSnapshot as any,
              notes:             dto.notes ?? existing.notes,
              dueDate:           dto.dueDate ? new Date(dto.dueDate) : existing.dueDate,
              finalizedAt:       new Date(),
              finalizedById:     userId ?? null,
            } as any,
          })
        : await tx.invoice.create({
            data: {
              ticketId,
              tenantId:          ticket.tenantId,
              status:            "FINALIZED",
              invoiceNumber,
              publicToken: randomBytes(32).toString("hex"),
              detailLevel,
              subtotal:          totals.subtotal,
              discount:          totals.discount,
              tax:               totals.tax,
              total:             totals.total,
              amountPaid:        totals.amountPaid,
              balanceDue:        totals.balanceDue,
              paymentStatus,
              lineItemsSnapshot: lineItemsSnapshot as any,
              notes:             dto.notes,
              dueDate:           dto.dueDate ? new Date(dto.dueDate) : null,
              finalizedAt:       new Date(),
              finalizedById:     userId ?? null,
            } as any,
          });

      // 9. Link all existing payments to this invoice
      await tx.payment.updateMany({
        where: { ticketId, invoiceId: null },
        data:  { invoiceId: invoice.id },
      });

      // 10. Sync ticket financial fields and transition operational status to READY_FOR_PICKUP
      const nextStatus = ticket.status === "DELIVERED" ? "DELIVERED" : "READY_FOR_PICKUP";
      const statusChanged = ticket.status !== nextStatus;

      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status:        nextStatus,
          totalAmount:   parseFloat(totals.total.toFixed(2)),
          tax:           parseFloat(totals.tax.toFixed(2)),
          invoiceNumber,
          paymentStatus: paymentStatus === "PAID" ? "PAID"
                       : paymentStatus === "PARTIALLY_PAID" ? "PARTIAL"
                       : "UNPAID",
        },
      });

      if (statusChanged) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId,
            status: "READY_FOR_PICKUP",
            customerNote: `Invoice ${invoiceNumber} generated for ${totals.total.toFixed(2)}. Device is ready for customer pickup.`,
            createdById: userId,
          },
        });
      }

      return invoice;
    });
  },

  getForTicket: async (ticketId: string, tenantId?: string) => {
    await requireTicket(ticketId, tenantId);
    const invoice = await invoiceRepository.findByTicketId(ticketId);
    if (!invoice || (invoice.status !== "FINALIZED" && invoice.status !== "VOID")) {
      // Return live draft summary for unfinalized invoices
      return invoiceService.getDraftSummary(ticketId, tenantId);
    }
    return {
      ...invoice,
      lineItems: (invoice.lineItemsSnapshot as any) || [],
    };
  },

  getByNumber: async (invoiceNumber: string, tenantId: string) => {
    const invoice = await prisma.invoice.findFirst({
      where: { tenantId, invoiceNumber },
      include: { ticket: { include: { customer: true } }, payments: { orderBy: { paidAt: "asc" } } },
    });
    if (!invoice) throw new NotFoundError("Invoice not found");
    return invoice;
  },

  /** Void a finalized invoice (audit trail preserved) */
  void: async (ticketId: string, dto: VoidInvoiceDto, tenantId?: string, userId?: string) => {
    await requireTicket(ticketId, tenantId);
    const invoice = await prisma.invoice.findUnique({ where: { ticketId } });
    if (!invoice) throw new NotFoundError("Invoice not found");
    if (invoice.status === "VOID") throw new ValidationError("Invoice is already void");

    return invoiceRepository.update(invoice.id, {
      status:      "VOID",
      voidedAt:    new Date(),
      voidedById:  userId ?? null,
      voidReason:  dto.reason,
    });
  },
};
