import { RoundingRule, TaxLineItemCalculation } from './taxTypes';

export function roundTo2Decimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Applies rounding rules to individual line items or final aggregated invoice totals.
 */
export function applyRounding(
  items: TaxLineItemCalculation[],
  roundingRule: RoundingRule = 'ROUND_PER_LINE'
): TaxLineItemCalculation[] {
  if (roundingRule === 'ROUND_PER_LINE') {
    return items.map(item => ({
      ...item,
      grossAmount: roundTo2Decimals(item.grossAmount),
      lineDiscount: roundTo2Decimals(item.lineDiscount),
      allocatedInvoiceDiscount: roundTo2Decimals(item.allocatedInvoiceDiscount),
      netAmountBeforeTax: roundTo2Decimals(item.netAmountBeforeTax),
      taxableAmount: roundTo2Decimals(item.taxableAmount),
      cgstAmount: roundTo2Decimals(item.cgstAmount),
      sgstAmount: roundTo2Decimals(item.sgstAmount),
      igstAmount: roundTo2Decimals(item.igstAmount),
      totalTax: roundTo2Decimals(item.totalTax),
      lineTotal: roundTo2Decimals(item.lineTotal),
    }));
  }

  // ROUND_AT_INVOICE leaves floating precision for final aggregation
  return items;
}
