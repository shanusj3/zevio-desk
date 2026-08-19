import { PaymentStatus, PaymentType } from "@prisma/client";

type PartItem = { price?: number; quantity?: number };
type TicketLike = {
  totalAmount?: any;
  estimatedCost?: any;
  partsCost?: any;
  laborCost?: any;
  tax?: any;
  discount?: any;
  partsRequired?: unknown;
  advanceDeposit?: any;
};

type PaymentLike = { amount: any; type: PaymentType };

export function computePartsTotal(partsRequired: unknown): number {
  if (!Array.isArray(partsRequired)) return 0;
  return (partsRequired as PartItem[]).reduce(
    (sum, part) => sum + (part.price || 0) * (part.quantity || 1),
    0
  );
}

export function computeTicketTotal(ticket: TicketLike & { lineItems?: any[] }): number {
  if (ticket.lineItems && ticket.lineItems.length > 0) {
    let sum = 0;
    for (const li of ticket.lineItems) {
      sum += Number(li.lineTotal || 0);
    }
    return sum;
  }

  const explicitTotal = Number(ticket.totalAmount || 0);
  if (explicitTotal > 0) return explicitTotal;

  const parts = ticket.partsCost != null ? Number(ticket.partsCost) : computePartsTotal(ticket.partsRequired);
  const labor = Number(ticket.laborCost || 0);
  const est = Number(ticket.estimatedCost || 0);
  const tax = Number(ticket.tax || 0);
  const discount = Number(ticket.discount || 0);

  const calc = parts + labor + est + tax - discount;
  return Math.max(0, calc);
}

export function computeAmountPaid(
  payments: PaymentLike[],
  legacyAdvance?: number | null
): number {
  if (payments.length === 0 && legacyAdvance) {
    return legacyAdvance;
  }

  const paid = payments.reduce((sum, payment) => {
    if (payment.type === "REFUND") return sum - Number(payment.amount);
    return sum + Number(payment.amount);
  }, 0);

  return Math.max(0, paid);
}

export function computePaymentStatus(
  amountPaid: number,
  totalBill: number
): PaymentStatus {
  if (totalBill > 0 && amountPaid >= totalBill) return "PAID";
  if (amountPaid > 0) return "PARTIAL";
  return "UNPAID";
}

export function enrichTicketWithPaymentSummary<
  T extends TicketLike & { payments?: PaymentLike[] }
>(ticket: T) {
  const payments = ticket.payments || [];
  const totalBill = computeTicketTotal(ticket);
  const amountPaid = computeAmountPaid(payments, ticket.advanceDeposit);
  const balanceDue = Math.max(0, totalBill - amountPaid);
  const paymentStatus = computePaymentStatus(amountPaid, totalBill);
  const advanceDeposit = payments
    .filter((payment) => payment.type === "ADVANCE")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return {
    ...ticket,
    amountPaid,
    balanceDue,
    totalBill,
    paymentStatus,
    advanceDeposit: Number(advanceDeposit) || Number(ticket.advanceDeposit) || 0,
  };
}
