export type TransactionFailure =
  | {
      code: 'TRANSACTION_NOT_FOUND';
      message: string;
    }
  | {
      code: 'PRODUCT_NOT_FOUND';
      message: string;
    }
  | {
      code: 'OUT_OF_STOCK';
      message: string;
    }
  | {
      code: 'PAYMENT_GATEWAY_ERROR';
      message: string;
    }
  | {
      code: 'STOCK_UPDATE_FAILED';
      message: string;
    }
  | {
      code: 'TRANSACTION_PERSISTENCE_ERROR';
      message: string;
    };

export const transactionNotFoundFailure = (id: string): TransactionFailure => ({
  code: 'TRANSACTION_NOT_FOUND',
  message: `Transaction with id "${id}" not found`,
});

export const productNotFoundFailure = (id: string): TransactionFailure => ({
  code: 'PRODUCT_NOT_FOUND',
  message: `Product with id "${id}" not found`,
});

export const outOfStockFailure = (productId: string): TransactionFailure => ({
  code: 'OUT_OF_STOCK',
  message: `Product "${productId}" is out of stock`,
});

export const paymentGatewayFailure = (): TransactionFailure => ({
  code: 'PAYMENT_GATEWAY_ERROR',
  message: 'Payment gateway error',
});

export const stockUpdateFailedFailure = (productId: string): TransactionFailure => ({
  code: 'STOCK_UPDATE_FAILED',
  message: `Unable to decrement stock for product "${productId}"`,
});

export const transactionPersistenceFailure = (
  operation: string,
): TransactionFailure => ({
  code: 'TRANSACTION_PERSISTENCE_ERROR',
  message: `Transaction persistence failure during ${operation}`,
});
