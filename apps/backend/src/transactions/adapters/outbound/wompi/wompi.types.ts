export type WompiTransactionRequest = {
  amount_in_cents: number;
  currency: string;
  reference: string;
  customer_email: string;
  payment_method: {
    type: string;
    token: string;
    installments: number;
  };
  acceptance_token: string;
  signature: string;
};

export type WompiTransactionResponse = {
  data: {
    id: string;
    status: string;
  };
};
