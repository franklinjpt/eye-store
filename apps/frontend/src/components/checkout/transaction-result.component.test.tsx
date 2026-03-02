import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { RootState } from '@/store';
import { productsSlice } from '@/store/slices/products.slice';
import { checkoutSlice } from '@/store/slices/checkout.slice';
import { uiSlice } from '@/store/slices/ui.slice';
import { TransactionResultView } from './transaction-result.component';

vi.mock('@/components/ui/glass-card', () => ({
  GlassCard: ({ children }: { children: ReactNode }) => (
    <div data-testid='glass-card'>{children}</div>
  ),
}));

vi.mock('@/services/api.service', () => ({
  createTransaction: vi.fn(),
  fetchTransactionStatus: vi.fn(),
  fetchProducts: vi.fn().mockResolvedValue([]),
}));

function createStore(overrides?: Partial<RootState['checkout']>) {
  return configureStore({
    reducer: {
      products: productsSlice.reducer,
      checkout: checkoutSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState: {
      products: { items: [], loading: false, error: null },
      checkout: {
        currentStep: 'result',
        selectedProductId: null,
        deliveryInfo: null,
        cardTokenId: null,
        acceptanceToken: null,
        transactionResult: null,
        isProcessing: false,
        isPolling: false,
        error: null,
        ...overrides,
      },
      ui: { isModalOpen: false },
    },
  });
}

describe('TransactionResultView', () => {
  it('should return null when transaction result is null', () => {
    const store = createStore({ transactionResult: null });

    const { container } = render(
      <Provider store={store}>
        <TransactionResultView />
      </Provider>,
    );

    expect(container.innerHTML).toBe('');
  });

  it('should display APPROVED status with success title and reference', () => {
    const store = createStore({
      transactionResult: {
        id: 'tx-1',
        status: 'APPROVED',
        reference: 'EYE-ABC123',
        amountInCents: 1000,
        productName: 'Blue Frame',
      },
    });

    render(
      <Provider store={store}>
        <TransactionResultView />
      </Provider>,
    );

    expect(screen.getByText('Payment Successful')).toBeTruthy();
    expect(screen.getByText('EYE-ABC123')).toBeTruthy();
    expect(screen.getByText('Blue Frame')).toBeTruthy();
  });

  it('should display DECLINED status with declined title', () => {
    const store = createStore({
      transactionResult: {
        id: 'tx-1',
        status: 'DECLINED',
        reference: 'EYE-DEC123',
        amountInCents: 1000,
        productName: 'Red Frame',
      },
    });

    render(
      <Provider store={store}>
        <TransactionResultView />
      </Provider>,
    );

    expect(screen.getByText('Payment Declined')).toBeTruthy();
  });

  it('should display PENDING status with polling indicator when isPolling is true', () => {
    const store = createStore({
      transactionResult: {
        id: 'tx-1',
        status: 'PENDING',
        reference: 'EYE-PEND',
        amountInCents: 1000,
        productName: 'Frame',
      },
      isPolling: true,
    });

    render(
      <Provider store={store}>
        <TransactionResultView />
      </Provider>,
    );

    expect(screen.getByText('Payment Pending')).toBeTruthy();
    expect(
      screen.getByText('Waiting for payment confirmation…'),
    ).toBeTruthy();
  });

  it('should disable back button during polling', () => {
    const store = createStore({
      transactionResult: {
        id: 'tx-1',
        status: 'PENDING',
        reference: 'EYE-PEND',
        amountInCents: 1000,
        productName: 'Frame',
      },
      isPolling: true,
    });

    render(
      <Provider store={store}>
        <TransactionResultView />
      </Provider>,
    );

    const button = screen.getByRole('button', {
      name: /waiting for confirmation/i,
    });
    expect(button).toBeDisabled();
  });

  it('should display error message when error is present', () => {
    const store = createStore({
      transactionResult: {
        id: 'tx-1',
        status: 'ERROR',
        reference: '',
        amountInCents: 0,
        productName: '',
      },
      error: 'Something went wrong',
    });

    render(
      <Provider store={store}>
        <TransactionResultView />
      </Provider>,
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('should dispatch resetCheckout and loadProducts on back to store click', async () => {
    const user = userEvent.setup();
    const store = createStore({
      transactionResult: {
        id: 'tx-1',
        status: 'APPROVED',
        reference: 'EYE-OK',
        amountInCents: 1000,
        productName: 'Frame',
      },
    });

    render(
      <Provider store={store}>
        <TransactionResultView />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: /back to store/i }));

    const state = store.getState();
    expect(state.checkout.currentStep).toBe('catalog');
    expect(state.checkout.transactionResult).toBeNull();
    expect(state.checkout.selectedProductId).toBeNull();
  });
});
