import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionResult } from '@/types';
import type { RootState } from '@/store';
import { productsSlice } from './products.slice';
import { checkoutSlice, processPayment } from './checkout.slice';
import { uiSlice } from './ui.slice';
import { createTransaction } from '@/services/api.service';

vi.mock('@/services/api.service', () => ({
  createTransaction: vi.fn(),
  fetchTransactionStatus: vi.fn(),
}));

describe('checkoutSlice/processPayment', () => {
  const createTransactionMock = vi.mocked(createTransaction);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createTransaction with checkout and customer data from typed state', async () => {
    const apiResponse: TransactionResult = {
      id: 'tx-1',
      status: 'PENDING',
      reference: 'REF-1',
      amountInCents: 10700000,
      productName: 'Blue Frame',
    };
    createTransactionMock.mockResolvedValue(apiResponse);

    const preloadedState: RootState = {
      products: {
        items: [
          {
            id: 'product-1',
            name: 'Blue Frame',
            price: 100000,
            stock: 1,
            position: 1,
            description: 'test',
            type: 'FRAME',
            sku: 'SKU-1',
            image: 'https://example.com/frame.jpg',
          },
        ],
        loading: false,
        error: null,
      },
      checkout: {
        currentStep: 'summary',
        selectedProductId: 'product-1',
        deliveryInfo: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          address: 'Street 123',
          city: 'Bogota',
          phone: '3001234567',
        },
        cardTokenId: 'tok_test',
        acceptanceToken: 'accept_test',
        transactionResult: null,
        isProcessing: false,
        isPolling: false,
        error: null,
      },
      ui: {
        isModalOpen: false,
      },
    };

    const store = configureStore({
      reducer: {
        products: productsSlice.reducer,
        checkout: checkoutSlice.reducer,
        ui: uiSlice.reducer,
      },
      preloadedState,
    });

    const result = await store.dispatch(processPayment());

    expect(createTransactionMock).toHaveBeenCalledWith({
      productId: 'product-1',
      tokenId: 'tok_test',
      acceptanceToken: 'accept_test',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      deliveryAddress: 'Street 123',
      deliveryCity: 'Bogota',
      customerPhone: '3001234567',
    });
    expect(processPayment.fulfilled.match(result)).toBe(true);
  });
});
