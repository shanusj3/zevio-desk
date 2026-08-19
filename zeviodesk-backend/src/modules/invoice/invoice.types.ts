import { LineItemType, TaxMode } from "../../services/billing.service.js";

// ─── Line Item DTOs ────────────────────────────────────────────────────────────
export interface CreateLineItemDto {
  type: LineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxMode?: TaxMode;
  taxRate?: number;
  // Warranty
  warrantyEnabled?: boolean;
  warrantyDuration?: number;
  warrantyUnit?: "DAYS" | "MONTHS" | "YEARS";
  warrantyCoverage?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
}

export interface UpdateLineItemDto extends Partial<CreateLineItemDto> {}

// ─── Invoice DTOs ──────────────────────────────────────────────────────────────
export interface FinalizeInvoiceDto {
  /** Optional custom notes printed on invoice */
  notes?: string;
  /** Optional due date */
  dueDate?: string;
}

export interface VoidInvoiceDto {
  reason: string;
}
