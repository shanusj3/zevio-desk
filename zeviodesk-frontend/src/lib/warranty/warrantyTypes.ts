/**
 * ZevioDesk Minimal Warranty Engine Types
 */

export type WarrantyDurationUnit = 'Days' | 'Months' | 'Years' | 'DAYS' | 'MONTHS' | 'YEARS';

export type WarrantyTypeCategory =
  | 'Shop Warranty'
  | 'Manufacturer Warranty'
  | 'Supplier Warranty'
  | 'Workmanship Warranty'
  | 'Extended Warranty'
  | string;

export interface WarrantyInfo {
  hasWarranty: boolean;
  warrantyType?: string;
  warrantyProvider?: string;
  warrantyDuration?: number;
  warrantyUnit?: WarrantyDurationUnit;
  warrantyExpiryDate?: string;
  warrantyNotes?: string;
  warrantyPeriod?: string;
}
