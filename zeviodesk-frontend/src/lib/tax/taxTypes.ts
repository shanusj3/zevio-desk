/**
 * ZevioDesk v1 Tax & GST Engine Types
 */

export type TaxTreatment = 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED' | 'NIL_RATED' | 'NON_GST';
export type PriceMode = 'TAX_INCLUSIVE' | 'TAX_EXCLUSIVE';
export type RoundingRule = 'ROUND_PER_LINE' | 'ROUND_AT_INVOICE';
export type SupplyType = 'INTRA_STATE' | 'INTER_STATE';

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // e.g. 18 for 18%
  taxType: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive: boolean;
}

export interface TaxProfile {
  id: string;
  name: string;
  taxRateId: string;
  taxRate: number;
}

export interface HsnSacCode {
  id: string;
  code: string;
  description: string;
  type: 'GOODS' | 'SERVICE';
  defaultTaxRate?: number;
  active: boolean;
}

export interface TaxContextSnapshot {
  sellerRegistrationId?: string;
  sellerGSTIN?: string;
  sellerState: string;
  sellerStateCode?: string;
  buyerGSTIN?: string;
  buyerState: string;
  buyerStateCode?: string;
  placeOfSupplyState: string;
  supplyType: SupplyType;
}

export interface TaxTransactionLineItem {
  productId?: string;
  serviceId?: string;
  name: string;
  hsnSacCode?: string;
  quantity: number;
  unitPrice: number;
  lineDiscount?: number; // Fixed ₹ discount for this line
  taxTreatment?: TaxTreatment;
  taxExemptionReason?: string;
  taxRate?: number; // e.g. 18 for 18%
}

export interface TaxTransactionPayload {
  items: TaxTransactionLineItem[];
  invoiceDiscount?: number; // Overall invoice level discount in ₹
  priceMode?: PriceMode;
  roundingRule?: RoundingRule;
  sellerState?: string;
  sellerGSTIN?: string;
  sellerRegistrationId?: string;
  buyerState?: string;
  buyerGSTIN?: string;
  placeOfSupplyState?: string;
  transactionType?: 'DOMESTIC' | 'SEZ' | 'EXPORT' | 'IMPORT';
}

export interface TaxLineItemCalculation {
  productId?: string;
  serviceId?: string;
  name: string;
  hsnSacCode?: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  lineDiscount: number;
  allocatedInvoiceDiscount: number;
  netAmountBeforeTax: number;
  taxableAmount: number;
  taxTreatment: TaxTreatment;
  taxExemptionReason?: string;
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

export interface TaxSummaryItem {
  rate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface TaxCalculationResult {
  items: TaxLineItemCalculation[];
  subtotal: number;
  totalLineDiscounts: number;
  totalInvoiceDiscount: number;
  netAmountBeforeTax: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  grandTotal: number;
  taxSummary: TaxSummaryItem[];
  priceMode: PriceMode;
  roundingRule: RoundingRule;
  taxContext: TaxContextSnapshot;
  taxEngineVersion: string;
}
