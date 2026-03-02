import type { Product, TransactionResult } from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${BASE_URL}/stock`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}

type CreateTransactionPayload = {
  productId: string;
  tokenId: string;
  acceptanceToken: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  customerPhone: string;
};

export async function createTransaction(
  payload: CreateTransactionPayload,
): Promise<TransactionResult> {
  const response = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Payment failed' }));
    throw new Error(error.message ?? 'Payment failed');
  }
  return response.json();
}

export async function fetchTransactionStatus(
  id: string,
  signal?: AbortSignal,
): Promise<TransactionResult> {
  const response = await fetch(`${BASE_URL}/transactions/${id}`, { signal });
  if (!response.ok) {
    throw new Error('Failed to fetch transaction status');
  }
  return response.json();
}
