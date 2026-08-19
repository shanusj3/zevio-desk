export type CustomerType = "WALK_IN" | "RETURNING" | "BUSINESS";

export interface CustomerDto {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  whatsappId?: string;
  address?: string;
  customerType: CustomerType;
  notes?: string;
  createdAt: string;
}

export interface CreateCustomerDto {
  tenantId?: string;
  name: string;
  email?: string;
  phone?: string;
  whatsappId?: string;
  address?: string;
  customerType?: CustomerType;
  notes?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
