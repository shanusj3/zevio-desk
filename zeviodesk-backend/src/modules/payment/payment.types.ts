export type PaymentType = "ADVANCE" | "PARTS" | "PARTIAL" | "FINAL" | "REFUND";

export interface CreatePaymentDto {
  amount: number;
  type: PaymentType;
  method?: string;
  notes?: string;
  reference?: string;
  paidAt?: string;
}

export interface PaymentSummary {
  amountPaid: number;
  balanceDue: number;
  totalBill: number;
}
