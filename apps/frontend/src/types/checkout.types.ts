export type CheckoutStep = 'catalog' | 'payment' | 'summary' | 'result';

export type DeliveryInfo = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  phone: string;
};

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

export type TransactionResult = {
  id: string;
  status: TransactionStatus;
  reference: string;
  amountInCents: number;
  productName: string;
};
