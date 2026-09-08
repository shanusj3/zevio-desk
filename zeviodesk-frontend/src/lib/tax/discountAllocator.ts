import { TaxTransactionLineItem } from './taxTypes';

export interface LineDiscountAllocation {
  grossAmount: number;
  lineDiscount: number;
  allocatedInvoiceDiscount: number;
  netAmountBeforeTax: number;
}

/**
 * Calculates line discounts and proportionally allocates invoice-level discount
 * across eligible taxable items.
 */
export function allocateDiscounts(
  items: TaxTransactionLineItem[],
  invoiceDiscount: number = 0
): LineDiscountAllocation[] {
  // Step 1: Calculate gross and line-discounted base for each line
  const lineBases = items.map(item => {
    const gross = (item.quantity || 1) * (item.unitPrice || 0);
    const lDiscount = Math.min(gross, item.lineDiscount || 0);
    const eligibleBase = Math.max(0, gross - lDiscount);
    const isEligible = (item.taxTreatment || 'TAXABLE') === 'TAXABLE';
    return { gross, lineDiscount: lDiscount, eligibleBase, isEligible };
  });

  // Step 2: Sum eligible base across taxable lines for proportional allocation
  const totalEligibleBase = lineBases.reduce(
    (sum, line) => sum + (line.isEligible ? line.eligibleBase : 0),
    0
  );

  const safeInvoiceDiscount = Math.max(0, invoiceDiscount);

  // Step 3: Allocate invoice discount proportionally
  return lineBases.map(line => {
    let allocatedInvDiscount = 0;

    if (line.isEligible && totalEligibleBase > 0 && safeInvoiceDiscount > 0) {
      allocatedInvDiscount = (line.eligibleBase / totalEligibleBase) * safeInvoiceDiscount;
      allocatedInvDiscount = Math.min(line.eligibleBase, allocatedInvDiscount);
    }

    const netBeforeTax = Math.max(0, line.eligibleBase - allocatedInvDiscount);

    return {
      grossAmount: line.gross,
      lineDiscount: line.lineDiscount,
      allocatedInvoiceDiscount: allocatedInvDiscount,
      netAmountBeforeTax: netBeforeTax,
    };
  });
}
