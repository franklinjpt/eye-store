import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkoutSlice, goToSummary, resetCheckout, selectProduct } from '../slices/checkout.slice';
import { uiSlice, openModal } from '../slices/ui.slice';
import { localStorageMiddleware } from './local-storage.middleware';

describe('localStorageMiddleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createTestStore() {
    return configureStore({
      reducer: {
        checkout: checkoutSlice.reducer,
        ui: uiSlice.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(localStorageMiddleware),
    });
  }

  it('should not persist for non-checkout actions', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const store = createTestStore();

    store.dispatch(openModal());
    await vi.runOnlyPendingTimersAsync();

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('should debounce checkout persistence writes', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const store = createTestStore();

    store.dispatch(selectProduct('product-1'));
    store.dispatch(goToSummary());

    await vi.advanceTimersByTimeAsync(249);
    expect(setItemSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('should clear storage immediately and cancel pending write on reset', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    const store = createTestStore();

    store.dispatch(selectProduct('product-1'));
    store.dispatch(resetCheckout());

    expect(removeItemSpy).toHaveBeenCalledTimes(1);

    await vi.runOnlyPendingTimersAsync();
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
