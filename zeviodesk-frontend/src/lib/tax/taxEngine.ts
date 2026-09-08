import {
  TaxTransactionPayload,
  TaxCalculationResult,
  TaxLineItemCalculation,
  PriceMode,
  RoundingRule,
} from './taxTypes';
import { buildTaxContextSnapshot } from './placeOfSupplyResolver';
import { allocateDiscounts } from './discountAllocator';
import { calculateLineTaxComponents } from './priceCalculator';
import { applyRounding, roundTo2Decimals } from './rounding';
import { buildTaxSummary } from './taxSummary';

export const CURRENT_TAX_ENGINE_VERSION = '1.0';

/**
 * Pure Tax Engine Entrypoint: calculateTax(payload)
 * Resolves tax rates, pre-tax discounts, inclusive/exclusive pricing,
 * place of supply, CGST/SGST/IGST, rounding, and produces an immutable snapshot payload.
 */
export function calculateTax(payload: TaxTransactionPayload): TaxCalculationResult {
  const priceMode: PriceMode = payload.priceMode || 'TAX_EXCLUSIVE';
  const roundingRule: RoundingRule = payload.roundingRule || 'ROUND_PER_LINE';

  // 1. Resolve Tax Identity & Place of Supply
  const taxContext = buildTaxContextSnapshot(payload);

  // 2. Allocate Line and Invoice Discounts
  const discounts = allocateDiscounts(payload.items, payload.invoiceDiscount);

  // 3. Compute Line Level Tax Components
  const rawCalculatedLines: TaxLineItemCalculation[] = payload.items.map((item, idx) => {
    const disc = discounts[idx];
    const taxTreatment = item.taxTreatment || 'TAXABLE';
    const taxRate = item.taxRate !== undefined ? item.taxRate : 18;

    const components = calculateLineTaxComponents({
      netAmountBeforeTax: disc.netAmountBeforeTax,
      taxRate: taxRate,
      taxTreatment: taxTreatment,
      priceMode: priceMode,
      supplyType: taxContext.supplyType,
    });

    return {
      productId: item.productId,
      serviceId: item.serviceId,
      name: item.name,
      hsnSacCode: item.hsnSacCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      grossAmount: disc.grossAmount,
      lineDiscount: disc.lineDiscount,
      allocatedInvoiceDiscount: disc.allocatedInvoiceDiscount,
      netAmountBeforeTax: disc.netAmountBeforeTax,
      taxableAmount: components.taxableAmount,
      taxTreatment: taxTreatment,
      taxExemptionReason: item.taxExemptionReason,
      taxRate: components.taxRate,
      cgstRate: components.cgstRate,
      cgstAmount: components.cgstAmount,
      sgstRate: components.sgstRate,
      sgstAmount: components.sgstAmount,
      igstRate: components.igstRate,
      igstAmount: components.igstAmount,
      totalTax: components.totalTax,
      lineTotal: components.lineTotal,
    };
  });

  // 4. Apply Rounding Strategy
  const finalCalculatedItems = applyRounding(rawCalculatedLines, roundingRule);

  // 5. Build Aggregated Tax Summary Table
  const taxSummary = buildTaxSummary(finalCalculatedItems);

  // 6. Aggregate Invoice Totals
  let subtotal = 0;
  let totalLineDiscounts = 0;
  let totalInvoiceDiscount = 0;
  let netAmountBeforeTax = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let totalTax = 0;
  let grandTotal = 0;

  finalCalculatedItems.forEach(line => {
    subtotal += line.grossAmount;
    totalLineDiscounts += line.lineDiscount;
    totalInvoiceDiscount += line.allocatedInvoiceDiscount;
    netAmountBeforeTax += line.netAmountBeforeTax;
    taxableAmount += line.taxableAmount;
    cgstTotal += line.cgstAmount;
    sgstTotal += line.sgstAmount;
    igstTotal += line.igstAmount;
    totalTax += line.totalTax;
    grandTotal += line.lineTotal;
  });

  return {
    items: finalCalculatedItems,
    subtotal: roundTo2Decimals(subtotal),
    totalLineDiscounts: roundTo2Decimals(totalLineDiscounts),
    totalInvoiceDiscount: roundTo2Decimals(totalInvoiceDiscount),
    netAmountBeforeTax: roundTo2Decimals(netAmountBeforeTax),
    taxableAmount: roundTo2Decimals(taxableAmount),
    cgstTotal: roundTo2Decimals(cgstTotal),
    sgstTotal: roundTo2Decimals(sgstTotal),
    igstTotal: roundTo2Decimals(igstTotal),
    totalTax: roundTo2Decimals(totalTax),
    grandTotal: roundTo2Decimals(grandTotal),
    taxSummary: taxSummary,
    priceMode: priceMode,
    roundingRule: roundingRule,
    taxContext: taxContext,
    taxEngineVersion: CURRENT_TAX_ENGINE_VERSION,
  };
}
