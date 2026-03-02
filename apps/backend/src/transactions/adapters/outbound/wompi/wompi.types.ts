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

// Full Wompi GET /transactions/:id response shape — includes error details for debugging
export type WompiGetTransactionResponse = {
  data: {
    id: string;
    status: string;
    // Present when status is ERROR or DECLINED
    payment_method?: {
      type?: string;
      extra?: {
        decline_code?: string;
        external_identifier?: string;
        receipt_number?: string;
        [key: string]: unknown;
      };
    };
    error?: {
      type?: string;
      reason?: string;
      [key: string]: unknown;
    };
    // Anything else Wompi sends
    [key: string]: unknown;
  };
};
