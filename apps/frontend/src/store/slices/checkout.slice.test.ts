import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionResult } from '@/types';
import type { RootState } from '@/store';
import { productsSlice } from './products.slice';
import {
  checkoutSlice,
  pollTransactionStatus,
  processPayment,
  selectProduct,
  goToSummary,
  goBackToPayment,
  resetCheckout,
} from './checkout.slice';
import { uiSlice } from './ui.slice';
import {
  createTransaction,
  fetchTransactionStatus,
} from '@/services/api.service';

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

  it('should reject when checkout data is missing', async () => {
    const preloadedState: RootState = {
      products: { items: [], loading: false, error: null },
      checkout: {
        currentStep: 'summary',
        selectedProductId: null,
        deliveryInfo: null,
        cardTokenId: null,
        acceptanceToken: null,
        transactionResult: null,
        isProcessing: false,
        isPolling: false,
        error: null,
      },
      ui: { isModalOpen: false },
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

    expect(processPayment.rejected.match(result)).toBe(true);
    if (processPayment.rejected.match(result)) {
      expect(result.error.message).toBe('Missing payment data');
    }
  });

  it('should reject when product is not found in store', async () => {
    const preloadedState: RootState = {
      products: { items: [], loading: false, error: null },
      checkout: {
        currentStep: 'summary',
        selectedProductId: 'product-missing',
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
      ui: { isModalOpen: false },
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

    expect(processPayment.rejected.match(result)).toBe(true);
    if (processPayment.rejected.match(result)) {
      expect(result.error.message).toBe('Product not found');
    }
  });

  it('should set error state and show ERROR result on processPayment rejection', async () => {
    createTransactionMock.mockRejectedValue(new Error('Payment failed'));

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
      ui: { isModalOpen: false },
    };

    const store = configureStore({
      reducer: {
        products: productsSlice.reducer,
        checkout: checkoutSlice.reducer,
        ui: uiSlice.reducer,
      },
      preloadedState,
    });

    await store.dispatch(processPayment());

    const state = store.getState();
    expect(state.checkout.error).toBe('Payment failed');
    expect(state.checkout.transactionResult?.status).toBe('ERROR');
    expect(state.checkout.currentStep).toBe('result');
    expect(state.checkout.isProcessing).toBe(false);
  });
});

describe('checkoutSlice/reducers', () => {
  function createTestStore() {
    return configureStore({
      reducer: {
        products: productsSlice.reducer,
        checkout: checkoutSlice.reducer,
        ui: uiSlice.reducer,
      },
    });
  }

  it('should transition through steps with reducer actions', () => {
    const store = createTestStore();

    store.dispatch(selectProduct('product-1'));
    expect(store.getState().checkout.currentStep).toBe('payment');
    expect(store.getState().checkout.selectedProductId).toBe('product-1');

    store.dispatch(goToSummary());
    expect(store.getState().checkout.currentStep).toBe('summary');

    store.dispatch(goBackToPayment());
    expect(store.getState().checkout.currentStep).toBe('payment');
  });

  it('should clear all state on resetCheckout', () => {
    const store = createTestStore();

    store.dispatch(selectProduct('product-1'));
    store.dispatch(goToSummary());
    store.dispatch(resetCheckout());

    const state = store.getState().checkout;
    expect(state.currentStep).toBe('catalog');
    expect(state.selectedProductId).toBeNull();
    expect(state.deliveryInfo).toBeNull();
    expect(state.cardTokenId).toBeNull();
    expect(state.acceptanceToken).toBeNull();
    expect(state.transactionResult).toBeNull();
    expect(state.isProcessing).toBe(false);
    expect(state.isPolling).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe('checkoutSlice/pollTransactionStatus', () => {
  const fetchTransactionStatusMock = vi.mocked(fetchTransactionStatus);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createTestStore() {
    return configureStore({
      reducer: {
        products: productsSlice.reducer,
        checkout: checkoutSlice.reducer,
        ui: uiSlice.reducer,
      },
    });
  }

  it('should stop polling when a final status is returned', async () => {
    fetchTransactionStatusMock
      .mockResolvedValueOnce({
        id: 'tx-1',
        status: 'PENDING',
        reference: 'REF-1',
        amountInCents: 1000,
        productName: 'Blue Frame',
      })
      .mockResolvedValueOnce({
        id: 'tx-1',
        status: 'PENDING',
        reference: 'REF-1',
        amountInCents: 1000,
        productName: 'Blue Frame',
      })
      .mockResolvedValueOnce({
        id: 'tx-1',
        status: 'APPROVED',
        reference: 'REF-1',
        amountInCents: 1000,
        productName: 'Blue Frame',
      });

    const store = createTestStore();
    const pollPromise = store.dispatch(pollTransactionStatus('tx-1'));

    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(3000);

    const result = await pollPromise;

    expect(pollTransactionStatus.fulfilled.match(result)).toBe(true);
    if (pollTransactionStatus.fulfilled.match(result)) {
      expect(result.payload.status).toBe('APPROVED');
    }
    expect(fetchTransactionStatusMock).toHaveBeenCalledTimes(3);
  });

  it('should return explicit pending result when all attempts fail', async () => {
    fetchTransactionStatusMock.mockRejectedValue(
      new Error('Failed to fetch transaction status'),
    );

    const store = createTestStore();
    const pollPromise = store.dispatch(pollTransactionStatus('tx-2'));

    await vi.advanceTimersByTimeAsync(3000 * 10);
    const result = await pollPromise;

    expect(pollTransactionStatus.fulfilled.match(result)).toBe(true);
    if (pollTransactionStatus.fulfilled.match(result)) {
      expect(result.payload).toEqual({
        id: 'tx-2',
        status: 'PENDING',
        reference: '',
        amountInCents: 0,
        productName: '',
      });
    }
    expect(fetchTransactionStatusMock).toHaveBeenCalledTimes(11);
  });

  it('should reject immediately when polling is aborted', async () => {
    fetchTransactionStatusMock.mockResolvedValue({
      id: 'tx-3',
      status: 'PENDING',
      reference: 'REF-3',
      amountInCents: 1000,
      productName: 'Blue Frame',
    });

    const store = createTestStore();
    const pollPromise = store.dispatch(pollTransactionStatus('tx-3'));

    pollPromise.abort();
    const result = await pollPromise;

    expect(pollTransactionStatus.rejected.match(result)).toBe(true);
    if (pollTransactionStatus.rejected.match(result)) {
      expect(result.error.name).toBe('AbortError');
    }
    expect(fetchTransactionStatusMock).toHaveBeenCalledTimes(0);
  });
});
