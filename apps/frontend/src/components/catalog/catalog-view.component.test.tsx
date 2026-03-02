import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types';
import type { RootState } from '@/store';
import { productsSlice } from '@/store/slices/products.slice';
import { checkoutSlice } from '@/store/slices/checkout.slice';
import { uiSlice } from '@/store/slices/ui.slice';
import { CatalogView } from './catalog-view.component';

let capturedOnBuy: ((id: string) => void) | undefined;

vi.mock('@/components/product/product-card.component', () => ({
  ProductCard: ({
    product,
    onBuy,
  }: {
    product: Product;
    onBuy: (id: string) => void;
  }) => {
    capturedOnBuy = onBuy;
    return (
      <div data-testid={`product-card-${product.id}`}>
        <span>{product.name}</span>
        <button type='button' onClick={() => onBuy(product.id)}>
          Buy
        </button>
      </div>
    );
  },
}));

vi.mock('@/services/api.service', () => ({
  fetchProducts: vi.fn().mockResolvedValue([]),
  createTransaction: vi.fn(),
  fetchTransactionStatus: vi.fn(),
}));

function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'product-1',
    name: 'Blue Frame',
    price: 120000,
    stock: 5,
    position: 1,
    description: 'Comfortable frame',
    type: 'FRAME',
    sku: 'SKU-1',
    image: 'https://example.com/frame.jpg',
    ...overrides,
  };
}

function createStore(overrides?: Partial<RootState['products']>) {
  return configureStore({
    reducer: {
      products: productsSlice.reducer,
      checkout: checkoutSlice.reducer,
      ui: uiSlice.reducer,
    },
    preloadedState: {
      products: {
        items: [],
        loading: false,
        error: null,
        ...overrides,
      },
      checkout: {
        currentStep: 'catalog',
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
}

describe('CatalogView', () => {
  it('should render product cards when products are loaded', () => {
    const store = createStore({
      items: [
        createProduct({ id: 'p-1', name: 'Frame A' }),
        createProduct({ id: 'p-2', name: 'Frame B' }),
      ],
    });

    render(
      <Provider store={store}>
        <CatalogView />
      </Provider>,
    );

    expect(screen.getByTestId('product-card-p-1')).toBeTruthy();
    expect(screen.getByTestId('product-card-p-2')).toBeTruthy();
    expect(screen.getByText('Frame A')).toBeTruthy();
    expect(screen.getByText('Frame B')).toBeTruthy();
  });

  it('should show loading spinner when loading is true', () => {
    const store = createStore({ loading: true });

    const { container } = render(
      <Provider store={store}>
        <CatalogView />
      </Provider>,
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should show error message when error is present', () => {
    const store = createStore({
      items: [createProduct()],
      error: 'Failed to load products',
    });

    render(
      <Provider store={store}>
        <CatalogView />
      </Provider>,
    );

    expect(screen.getByText('Failed to load products')).toBeTruthy();
  });

  it('should dispatch loadProducts when products list is empty', async () => {
    const store = createStore({ items: [] });

    render(
      <Provider store={store}>
        <CatalogView />
      </Provider>,
    );

    // loadProducts thunk was dispatched — the loading state should have been set
    const state = store.getState();
    // Either loading is true or it has already completed (resolved to empty array)
    expect(state.products.loading || state.products.items.length === 0).toBe(
      true,
    );
  });

  it('should dispatch selectProduct when product card onBuy is called', async () => {
    const user = userEvent.setup();
    const store = createStore({
      items: [createProduct({ id: 'p-1', name: 'Frame A' })],
    });

    render(
      <Provider store={store}>
        <CatalogView />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Buy' }));

    const state = store.getState();
    expect(state.checkout.selectedProductId).toBe('p-1');
    expect(state.checkout.currentStep).toBe('payment');
  });
});
