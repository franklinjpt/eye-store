import type { Middleware } from '@reduxjs/toolkit';
import type { CheckoutStep, DeliveryInfo, TransactionResult } from '@/types';

const STORAGE_KEY = 'eye-store-checkout';

type PersistedCheckout = {
  currentStep: CheckoutStep;
  selectedProductId: string | null;
  deliveryInfo: DeliveryInfo | null;
  cardTokenId: string | null;
  acceptanceToken: string | null;
  transactionResult: TransactionResult | null;
};

type PersistedState = {
  checkout: PersistedCheckout & {
    isProcessing: boolean;
    isPolling: boolean;
    error: string | null;
  };
};

export function loadPersistedState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;

    const checkout = JSON.parse(raw) as PersistedCheckout;
    return {
      checkout: {
        ...checkout,
        isProcessing: false,
        isPolling: false,
        error: null,
      },
    };
  } catch {
    return undefined;
  }
}

export function clearPersistedState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const localStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);
    const state = store.getState() as { checkout: PersistedCheckout };

    // Clear on reset
    if (
      typeof action === 'object' &&
      action !== null &&
      'type' in action &&
      action.type === 'checkout/resetCheckout'
    ) {
      clearPersistedState();
      return result;
    }

    // Persist checkout state (never raw card data)
    const toStore: PersistedCheckout = {
      currentStep: state.checkout.currentStep,
      selectedProductId: state.checkout.selectedProductId,
      deliveryInfo: state.checkout.deliveryInfo,
      cardTokenId: state.checkout.cardTokenId,
      acceptanceToken: state.checkout.acceptanceToken,
      transactionResult: state.checkout.transactionResult,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // localStorage full or unavailable — silently ignore
    }

    return result;
  };
