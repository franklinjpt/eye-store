import { CHECKOUT_FEES_PESOS } from '@eye-store/shared';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { productsSlice } from '@/store/slices/products.slice';
import { checkoutSlice } from '@/store/slices/checkout.slice';
import { uiSlice } from '@/store/slices/ui.slice';
import { SummaryBackdrop } from './summary-backdrop.component';

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function toCurrencyRegex(amount: number): RegExp {
  const formatted = formatCOP(amount);
  const escaped = formatted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped.replace(/[\u00A0\s]+/g, '\\s*'));
}

describe('SummaryBackdrop', () => {
  it('should render fees and total using shared fee constants', () => {
    const productPrice = 120000;
    const total =
      productPrice + CHECKOUT_FEES_PESOS.base + CHECKOUT_FEES_PESOS.delivery;

    const preloadedState = {
      products: {
        items: [
          {
            id: 'product-1',
            name: 'Blue Frame',
            price: productPrice,
            stock: 5,
            position: 1,
            description: 'Comfortable frame',
            type: 'FRAME',
            sku: 'SKU-1',
            image: 'https://example.com/frame.jpg',
          },
        ],
        loading: false,
        error: null,
      },
      checkout: {
        currentStep: 'summary' as const,
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

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(screen.getByText('Base Fee')).toBeTruthy();
    expect(screen.getByText('Delivery Fee')).toBeTruthy();
    expect(screen.getByText(toCurrencyRegex(CHECKOUT_FEES_PESOS.base))).toBeTruthy();
    expect(
      screen.getByText(toCurrencyRegex(CHECKOUT_FEES_PESOS.delivery)),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: new RegExp(`Pay\\s*${toCurrencyRegex(total).source}`),
      }),
    ).toBeTruthy();
  });

  it('should return null when product or deliveryInfo is missing', () => {
    const store = configureStore({
      reducer: {
        products: productsSlice.reducer,
        checkout: checkoutSlice.reducer,
        ui: uiSlice.reducer,
      },
      preloadedState: {
        products: { items: [], loading: false, error: null },
        checkout: {
          currentStep: 'summary' as const,
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
      },
    });

    const { container } = render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(container.innerHTML).toBe('');
  });

  it('should display delivery info (name, address, city, email, phone)', () => {
    const preloadedState = {
      products: {
        items: [
          {
            id: 'product-1',
            name: 'Blue Frame',
            price: 120000,
            stock: 5,
            position: 1,
            description: 'Comfortable frame',
            type: 'FRAME',
            sku: 'SKU-1',
            image: 'https://example.com/frame.jpg',
          },
        ],
        loading: false,
        error: null,
      },
      checkout: {
        currentStep: 'summary' as const,
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

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText(/Street 123/)).toBeTruthy();
    expect(screen.getByText(/Bogota/)).toBeTruthy();
    expect(screen.getByText('jane@example.com')).toBeTruthy();
    expect(screen.getByText('3001234567')).toBeTruthy();
  });

  it('should show Processing spinner when isProcessing is true', () => {
    const preloadedState = {
      products: {
        items: [
          {
            id: 'product-1',
            name: 'Blue Frame',
            price: 120000,
            stock: 5,
            position: 1,
            description: 'Comfortable frame',
            type: 'FRAME',
            sku: 'SKU-1',
            image: 'https://example.com/frame.jpg',
          },
        ],
        loading: false,
        error: null,
      },
      checkout: {
        currentStep: 'summary' as const,
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
        isProcessing: true,
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

    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(screen.getByText(/Processing/i)).toBeTruthy();
  });
});
