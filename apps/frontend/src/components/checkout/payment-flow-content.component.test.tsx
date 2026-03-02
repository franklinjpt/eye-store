import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import type { RootState } from '@/store';
import type { DeliveryInfo } from '@/types';
import { productsSlice } from '@/store/slices/products.slice';
import { checkoutSlice } from '@/store/slices/checkout.slice';
import { uiSlice } from '@/store/slices/ui.slice';
import { PaymentFlowContent } from './payment-flow-content.component';

type CreditCardData = {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
};

vi.mock('./credit-card-form.component', () => ({
  CreditCardForm: ({
    onSubmit,
    onBack,
    isLoading,
  }: {
    onSubmit: (data: CreditCardData) => void;
    onBack?: () => void;
    isLoading?: boolean;
  }) => {
    return (
      <div data-testid='credit-card-form'>
        <span>{isLoading ? 'Tokenizing...' : 'Card Form'}</span>
        <button
          type='button'
          onClick={() =>
            onSubmit({
              cardNumber: '4242424242424242',
              expiry: '12/30',
              cvv: '123',
              cardholderName: 'Jane Doe',
            })
          }
        >
          Submit Card
        </button>
        {onBack && (
          <button type='button' onClick={onBack}>
            Close
          </button>
        )}
      </div>
    );
  },
}));

vi.mock('./delivery-form.component', () => ({
  DeliveryForm: ({
    onSubmit,
    onBack,
  }: {
    onSubmit: (info: DeliveryInfo) => void;
    onBack: () => void;
    initialValues?: DeliveryInfo | null;
  }) => {
    return (
      <div data-testid='delivery-form'>
        <span>Delivery Form</span>
        <button
          type='button'
          onClick={() =>
            onSubmit({
              fullName: 'Jane Doe',
              email: 'jane@example.com',
              address: 'Street 123',
              city: 'Bogota',
              phone: '3001234567',
            })
          }
        >
          Submit Delivery
        </button>
        <button type='button' onClick={onBack}>
          Back
        </button>
      </div>
    );
  },
}));

const mockTokenizeCard = vi.fn();
const mockGetAcceptanceToken = vi.fn();

vi.mock('@/services/wompi.service', () => ({
  tokenizeCard: (...args: unknown[]) => mockTokenizeCard(...args),
  getAcceptanceToken: (...args: unknown[]) => mockGetAcceptanceToken(...args),
}));

vi.mock('@/services/api.service', () => ({
  createTransaction: vi.fn(),
  fetchTransactionStatus: vi.fn(),
  fetchProducts: vi.fn().mockResolvedValue([]),
}));

function createStore(overrides?: Partial<RootState['checkout']>) {
  const preloadedState: RootState = {
    products: { items: [], loading: false, error: null },
    checkout: {
      currentStep: 'payment',
      selectedProductId: 'product-1',
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
  };

  return configureStore({
    reducer: {
      products: productsSlice.reducer,
      checkout: checkoutSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState,
  });
}

describe('PaymentFlowContent', () => {
  it('should render credit card form on initial mount', () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <PaymentFlowContent onClose={vi.fn()} />
      </Provider>,
    );

    expect(screen.getByTestId('credit-card-form')).toBeTruthy();
    expect(screen.getByText('Card Form')).toBeTruthy();
  });

  it('should show delivery form after successful card tokenization', async () => {
    const user = userEvent.setup();
    mockTokenizeCard.mockResolvedValue('tok_test');
    mockGetAcceptanceToken.mockResolvedValue('accept_test');
    const store = createStore();

    render(
      <Provider store={store}>
        <PaymentFlowContent onClose={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Submit Card' }));

    await waitFor(() => {
      expect(screen.getByTestId('delivery-form')).toBeTruthy();
    });

    const state = store.getState();
    expect(state.checkout.cardTokenId).toBe('tok_test');
    expect(state.checkout.acceptanceToken).toBe('accept_test');
  });

  it('should display error when tokenization fails', async () => {
    const user = userEvent.setup();
    mockTokenizeCard.mockRejectedValue(new Error('tokenize failed'));
    const store = createStore();

    render(
      <Provider store={store}>
        <PaymentFlowContent onClose={vi.fn()} />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Submit Card' }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to process card/i),
      ).toBeTruthy();
    });
  });

  it('should dispatch setDeliveryInfo and goToSummary on delivery submit', async () => {
    const user = userEvent.setup();
    mockTokenizeCard.mockResolvedValue('tok_test');
    mockGetAcceptanceToken.mockResolvedValue('accept_test');
    const store = createStore();

    render(
      <Provider store={store}>
        <PaymentFlowContent onClose={vi.fn()} />
      </Provider>,
    );

    // First advance to delivery form
    await user.click(screen.getByRole('button', { name: 'Submit Card' }));
    await waitFor(() => {
      expect(screen.getByTestId('delivery-form')).toBeTruthy();
    });

    // Submit delivery
    await user.click(
      screen.getByRole('button', { name: 'Submit Delivery' }),
    );

    const state = store.getState();
    expect(state.checkout.deliveryInfo).toEqual({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      address: 'Street 123',
      city: 'Bogota',
      phone: '3001234567',
    });
    expect(state.checkout.currentStep).toBe('summary');
  });

  it('should go back to card form when delivery back is clicked', async () => {
    const user = userEvent.setup();
    mockTokenizeCard.mockResolvedValue('tok_test');
    mockGetAcceptanceToken.mockResolvedValue('accept_test');
    const store = createStore();

    render(
      <Provider store={store}>
        <PaymentFlowContent onClose={vi.fn()} />
      </Provider>,
    );

    // Advance to delivery form
    await user.click(screen.getByRole('button', { name: 'Submit Card' }));
    await waitFor(() => {
      expect(screen.getByTestId('delivery-form')).toBeTruthy();
    });

    // Click back
    await user.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form')).toBeTruthy();
    });
  });
});
