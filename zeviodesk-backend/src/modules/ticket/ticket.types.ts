export type TicketStatus =
  | "RECEIVED"
  | "DIAGNOSING"
  | "WAITING_FOR_PARTS"
  | "IN_PROGRESS"
  | "REPAIR_COMPLETED"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "DELIVERED"
  | "CANCELLED";

export type TicketPriority = "NORMAL" | "URGENT";

export interface TicketAttachment {
  id: string;
  url: string;
  type: "photo" | "video";
  stage: "intake" | "repair" | "handover";
  uploadedBy?: string;
  uploadedAt: string;
  fileName?: string;
}

export interface PartItem {
  name: string;
  partNumber?: string;
  quantity: number;
  sourcedFrom?: string;
}

export interface CreateTicketDto {
  id?: string;
  tenantId?: string;
  customerId: string;
  assignedToId?: string;
  title: string;
  description: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  estimatedCompletionDate?: string;
  itemCategory?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  itemCondition?: string;
  accessories?: string;
  globalCatalogItemId?: string;
  tenantCatalogItemId?: string;
  reportedIssue?: string;
  techDiagnosis?: string;
  diagnosisNotes?: string;
  rootCause?: string;
  partsRequired?: PartItem[];
  partsSourcedFrom?: string;
  laborDescription?: string;
  timeSpent?: string;
  warrantyStatus?: string;
  estimatedCost?: number;
  approvedByCustomer?: boolean;
  approvalMethod?: string;
  partsCost?: number;
  laborCost?: number;
  tax?: number;
  discount?: number;
  totalAmount?: number;
  paymentStatus?: "UNPAID" | "PARTIAL" | "PAID";
  paymentMethod?: string;
  advanceDeposit?: number;
  advanceAmount?: number;
  advanceNotes?: string;
  internalNotes?: string;
  attachments?: TicketAttachment[];
  photos?: string[];
  attachmentIds?: string[];
}

export interface UpdateTicketDto extends Partial<CreateTicketDto> {
  actualCompletionDate?: string;
  approvalDate?: string;
  pickupDate?: string;
  pickupSignatureUrl?: string;
  feedbackRating?: number;
  followUpDate?: string;
  trackingEnabled?: boolean;
  showEstimate?: boolean;
  showPartsBreakdown?: boolean;
  showAdvancePaid?: boolean;
  showBalanceDue?: boolean;
  showSerialMasked?: boolean;
  customerNote?: string;
}

/** All mutable ticket fields (excluding ownership). */
export const ALL_UPDATE_FIELDS: (keyof UpdateTicketDto)[] = [
  "title", "description", "priority", "status",
  "assignedToId",
  "estimatedCompletionDate", "actualCompletionDate", "pickupDate", "followUpDate",
  "itemCategory", "brand", "model", "serialNumber", "itemCondition",
  "accessories", "reportedIssue", "techDiagnosis", "diagnosisNotes",
  "rootCause", "partsRequired", "partsSourcedFrom", "laborDescription",
  "timeSpent", "warrantyStatus", "estimatedCost", "approvedByCustomer",
  "approvalMethod", "approvalDate", "partsCost", "laborCost", "tax", "discount",
  "totalAmount", "paymentStatus", "paymentMethod",
  "advanceDeposit", "internalNotes", "attachments", "photos",
  "pickupSignatureUrl", "feedbackRating",
  "globalCatalogItemId", "tenantCatalogItemId",
  "trackingEnabled", "showEstimate", "showPartsBreakdown", "showAdvancePaid",
  "showBalanceDue", "showSerialMasked", "customerNote",
];
