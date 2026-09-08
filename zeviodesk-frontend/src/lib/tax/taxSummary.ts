import { TaxLineItemCalculation, TaxSummaryItem } from './taxTypes';
import { roundTo2Decimals } from './rounding';

/**
 * Aggregates line items into a Tax Summary breakdown table grouped by tax rate.
 */
export function buildTaxSummary(items: TaxLineItemCalculation[]): TaxSummaryItem[] {
  const summaryMap: Record<number, TaxSummaryItem> = {};

  items.forEach(item => {
    const rate = item.taxRate || 0;

    if (!summaryMap[rate]) {
      summaryMap[rate] = {
        rate: rate,
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
      };
    }

    summaryMap[rate].taxableAmount += item.taxableAmount;
    summaryMap[rate].cgstAmount += item.cgstAmount;
    summaryMap[rate].sgstAmount += item.sgstAmount;
    summaryMap[rate].igstAmount += item.igstAmount;
    summaryMap[rate].totalTax += item.totalTax;
  });

  return Object.values(summaryMap)
    .sort((a, b) => a.rate - b.rate)
    .map(summary => ({
      rate: summary.rate,
      taxableAmount: roundTo2Decimals(summary.taxableAmount),
      cgstAmount: roundTo2Decimals(summary.cgstAmount),
      sgstAmount: roundTo2Decimals(summary.sgstAmount),
      igstAmount: roundTo2Decimals(summary.igstAmount),
      totalTax: roundTo2Decimals(summary.totalTax),
    }));
}
