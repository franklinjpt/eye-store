export type PaymentRequest = {
  amountInCents: number;
  currency: string;
  reference: string;
  customerEmail: string;
  paymentMethodToken: string;
  acceptanceToken: string;
  installments: number;
};

export type PaymentResponse = {
  transactionId: string;
  status: string;
};

export interface PaymentGatewayPort {
  createPayment(request: PaymentRequest): Promise<PaymentResponse>;
}
