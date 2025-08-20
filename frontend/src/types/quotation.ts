export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export interface QuotationItem {
  id: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  name?: string;
  productId?: number;
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  customer: {
    id: number;
    name: string;
  };
  date: string;
  validUntil?: string;
  terms?: string;
  notes?: string;
  status: QuotationStatus;
  discount: number;
  shipping: number;
  totalAmount: number;
  items: QuotationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotationDto {
  customerId: number;
  date: string | Date;
  validUntil?: string | Date;
  terms?: string;
  notes?: string;
  status: QuotationStatus;
  discount?: number;
  shipping?: number;
  items: {
    id: number; // product id
    quantity: number;
    name: string; // product name
  }[];
}

export interface UpdateQuotationDto {
  customerId?: number;
  date?: string | Date;
  validUntil?: string | Date;
  terms?: string;
  notes?: string;
  status?: QuotationStatus;
  discount?: number;
  shipping?: number;
  items?: {
    id: number; // product id
    quantity: number;
    name: string; // product name
  }[];
}
