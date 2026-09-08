import { PriceMode, SupplyType, TaxTreatment } from './taxTypes';

export interface CalculatedLineTaxComponents {
  taxableAmount: number;
  taxRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
}

/**
 * Computes Taxable Value, CGST, SGST, IGST, Total Tax, and Line Total
 * according to PriceMode (Inclusive vs Exclusive), TaxTreatment, and SupplyType.
 */
export function calculateLineTaxComponents(params: {
  netAmountBeforeTax: number;
  taxRate: number; // e.g. 18
  taxTreatment: TaxTreatment;
  priceMode: PriceMode;
  supplyType: SupplyType;
}): CalculatedLineTaxComponents {
  const { netAmountBeforeTax, taxRate, taxTreatment, priceMode, supplyType } = params;

  // Non-taxable treatments (EXEMPT, ZERO_RATED, NIL_RATED, NON_GST)
  if (taxTreatment !== 'TAXABLE' || taxRate <= 0) {
    return {
      taxableAmount: netAmountBeforeTax,
      taxRate: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 0,
      lineTotal: netAmountBeforeTax,
    };
  }

  const rateDecimal = taxRate / 100;
  let taxableAmount = 0;
  let totalTax = 0;
  let lineTotal = 0;

  if (priceMode === 'TAX_INCLUSIVE') {
    lineTotal = netAmountBeforeTax;
    taxableAmount = lineTotal / (1 + rateDecimal);
    totalTax = lineTotal - taxableAmount;
  } else {
    taxableAmount = netAmountBeforeTax;
    totalTax = taxableAmount * rateDecimal;
    lineTotal = taxableAmount + totalTax;
  }

  // Place of Supply CGST/SGST vs IGST split
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (supplyType === 'INTRA_STATE') {
    cgstRate = taxRate / 2;
    sgstRate = taxRate / 2;
    cgstAmount = totalTax / 2;
    sgstAmount = totalTax / 2;
  } else {
    igstRate = taxRate;
    igstAmount = totalTax;
  }

  return {
    taxableAmount,
    taxRate,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax,
    lineTotal,
  };
}
