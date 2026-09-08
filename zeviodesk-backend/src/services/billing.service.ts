import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../config/prisma.js";
import { ValidationError } from "../errors/AppError.js";

// ─── Tax Mode Types ────────────────────────────────────────────────────────────
export type TaxMode = "EXCLUSIVE" | "INCLUSIVE" | "NONE";
export type LineItemType = "PART" | "LABOR" | "SERVICE" | "PRODUCT" | "OTHER";

// ─── Input DTO ─────────────────────────────────────────────────────────────────
export interface LineItemInput {
  type: LineItemType;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discountAmount?: number | string;
  taxMode?: TaxMode;
  taxRate?: number | string;
  // Warranty snapshot inputs
  warrantyEnabled?: boolean;
  warrantyDuration?: number;
  warrantyUnit?: "DAYS" | "MONTHS" | "YEARS";
  warrantyCoverage?: string;
  warrantyStartDate?: string | Date;
  warrantyEndDate?: string | Date;
}

// ─── Calculated Line Item ──────────────────────────────────────────────────────
export interface CalculatedLineItem {
  type: LineItemType;
  description: string;
  quantity: Decimal;
  unitPrice: Decimal;
  discountAmount: Decimal;
  subtotal: Decimal;  // (qty * unitPrice) - discount
  taxMode: TaxMode;
  taxRate: Decimal;
  taxAmount: Decimal;
  lineTotal: Decimal; // subtotal + taxAmount
  // Warranty snapshot
  warrantyEnabled: boolean;
  warrantyDuration: number | null;
  warrantyUnit: string | null;
  warrantyCoverage: string | null;
  warrantyStartDate: Date | null;
  warrantyEndDate: Date | null;
}

// ─── Invoice Totals ────────────────────────────────────────────────────────────
export interface InvoiceTotals {
  subtotal: Decimal;      // Sum of all (qty * unitPrice - discountAmount)
  discount: Decimal;      // Sum of all discounts
  taxableAmount: Decimal; // subtotal - discount
  tax: Decimal;           // Sum of all taxAmounts
  total: Decimal;         // taxableAmount + tax
  amountPaid: Decimal;
  balanceDue: Decimal;
}

// ─── Rounding helper ──────────────────────────────────────────────────────────
function round2(d: Decimal): Decimal {
  return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

// ─── Core: Calculate a single line item ───────────────────────────────────────
export function calculateLineItem(input: LineItemInput): CalculatedLineItem {
  const qty       = round2(new Decimal(input.quantity.toString()));
  const unitPrice = round2(new Decimal(input.unitPrice.toString()));
  const discount  = round2(new Decimal((input.discountAmount ?? 0).toString()));
  const taxMode   = (input.taxMode ?? "NONE") as TaxMode;
  const taxRate   = round2(new Decimal((input.taxRate ?? 0).toString()));

  if (qty.lte(0))       throw new ValidationError("Line item quantity must be > 0");
  if (unitPrice.lt(0))  throw new ValidationError("Line item unit price cannot be negative");
  if (discount.lt(0))   throw new ValidationError("Discount cannot be negative");

  const gross     = round2(qty.mul(unitPrice)); // qty * unitPrice
  const subtotal  = round2(gross.sub(discount));

  if (subtotal.lt(0)) throw new ValidationError("Discount cannot exceed line item price");

  let taxAmount: Decimal;
  let lineTotal: Decimal;

  if (taxMode === "EXCLUSIVE") {
    // Tax is added on top of subtotal
    taxAmount = round2(subtotal.mul(taxRate).div(100));
    lineTotal = round2(subtotal.add(taxAmount));
  } else if (taxMode === "INCLUSIVE") {
    // unitPrice already includes tax — extract the embedded tax
    // taxableValue = subtotal / (1 + taxRate/100)
    const divisor   = new Decimal(1).add(taxRate.div(100));
    const taxable   = round2(subtotal.div(divisor));
    taxAmount       = round2(subtotal.sub(taxable));
    lineTotal       = subtotal; // total does not change
  } else {
    // NONE: no tax
    taxAmount = new Decimal(0);
    lineTotal = subtotal;
  }

  // Warranty snapshot
  const warrantyEnabled   = input.warrantyEnabled ?? false;
  let warrantyStartDate: Date | null = null;
  let warrantyEndDate: Date | null = null;

  if (warrantyEnabled) {
    warrantyStartDate = input.warrantyStartDate ? new Date(input.warrantyStartDate) : new Date();
    if (input.warrantyEndDate) {
      warrantyEndDate = new Date(input.warrantyEndDate);
    } else if (input.warrantyDuration && input.warrantyUnit) {
      const end = new Date(warrantyStartDate);
      const unit = String(input.warrantyUnit).toUpperCase();
      const dur = Math.max(1, Number(input.warrantyDuration) || 1);
      if (unit.includes('DAY')) {
        end.setDate(end.getDate() + dur);
      } else if (unit.includes('MONTH')) {
        end.setMonth(end.getMonth() + dur);
      } else if (unit.includes('YEAR')) {
        end.setFullYear(end.getFullYear() + dur);
      }
      warrantyEndDate = end;
    }
  }

  return {
    type:             input.type,
    description:      input.description,
    quantity:         qty,
    unitPrice,
    discountAmount:   discount,
    subtotal,
    taxMode,
    taxRate,
    taxAmount,
    lineTotal,
    warrantyEnabled,
    warrantyDuration: input.warrantyDuration ?? null,
    warrantyUnit:     input.warrantyUnit ?? null,
    warrantyCoverage: input.warrantyCoverage ?? null,
    warrantyStartDate,
    warrantyEndDate,
  };
}

export function calculateInvoiceTotals(
  lineItems: CalculatedLineItem[],
  amountPaidArg: Decimal | number | string = 0
): InvoiceTotals {
  let subtotal     = new Decimal(0);
  let totalDiscount = new Decimal(0);
  let totalTax      = new Decimal(0);

  for (const li of lineItems) {
    // subtotal = sum of (qty*unitPrice - discount) across all lines
    subtotal      = subtotal.add(li.subtotal);
    totalDiscount = totalDiscount.add(li.discountAmount);
    totalTax      = totalTax.add(li.taxAmount);
  }

  subtotal      = round2(subtotal);
  totalDiscount = round2(totalDiscount);
  const taxableAmount = round2(subtotal); // Already has discount baked in per-line
  totalTax      = round2(totalTax);
  const total   = round2(taxableAmount.add(totalTax));

  const amountPaid = round2(new Decimal(amountPaidArg.toString()));
  const balanceDue = round2(Decimal.max(0, total.sub(amountPaid)));

  return { subtotal, discount: totalDiscount, taxableAmount, tax: totalTax, total, amountPaid, balanceDue };
}

// ─── Guard: Reject modifications when invoice is FINALIZED/ISSUED/PAID or ticket is DELIVERED/COMPLETED ────
export async function assertInvoiceNotFinalized(ticketId: string): Promise<void> {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (ticket && (ticket.status === "COMPLETED" || ticket.status === "DELIVERED" || ticket.status === "CANCELLED")) {
    throw new ValidationError(
      "This ticket is completed/delivered and locked. Modifying parts, adding charge lines, or editing billing information is not allowed."
    );
  }
  const invoice = await prisma.invoice.findUnique({ where: { ticketId } });
  if (invoice && (invoice.status === "FINALIZED" || invoice.status === "ISSUED" || invoice.status === "PAID")) {
    throw new ValidationError(
      "This invoice has been issued/finalized and cannot be modified. Only comments and activity logs are permitted."
    );
  }
}

// ─── Guard: Reject ticket deletion when invoice exists ───────────────────────
export async function assertTicketHasNoInvoice(ticketId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({ where: { ticketId } });
  if (invoice) {
    throw new ValidationError(
      `Cannot delete this ticket — it has an invoice (${invoice.invoiceNumber ?? invoice.id}) attached. ` +
      `Void the invoice before deleting the ticket.`
    );
  }
}

// ─── Compute net amount paid from Payment[] ───────────────────────────────────
export function computeNetPaid(payments: { amount: any; type: string }[]): Decimal {
  let net = new Decimal(0);
  for (const p of payments) {
    const amt = new Decimal(p.amount.toString());
    if (p.type === "REFUND") {
      net = net.sub(amt);
    } else {
      net = net.add(amt);
    }
  }
  return round2(net);
}
