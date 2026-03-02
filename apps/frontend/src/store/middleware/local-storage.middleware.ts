import type { Middleware } from '@reduxjs/toolkit';
import type { CheckoutStep, DeliveryInfo, TransactionResult } from '@/types';

const STORAGE_KEY = 'eye-store-checkout';
const CHECKOUT_ACTION_PREFIX = 'checkout/';
const RESET_CHECKOUT_ACTION = 'checkout/resetCheckout';
const PERSIST_DEBOUNCE_MS = 250;

let persistTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

function isReduxAction(action: unknown): action is { type: string } {
  return (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    typeof (action as { type: unknown }).type === 'string'
  );
}

function clearPendingPersistTimeout(): void {
  if (persistTimeoutId !== null) {
    clearTimeout(persistTimeoutId);
    persistTimeoutId = null;
  }
}

export const localStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);

    if (!isReduxAction(action)) {
      return result;
    }

    if (action.type === RESET_CHECKOUT_ACTION) {
      clearPendingPersistTimeout();
      clearPersistedState();
      return result;
    }

    if (!action.type.startsWith(CHECKOUT_ACTION_PREFIX)) {
      return result;
    }

    const state = store.getState() as { checkout: PersistedCheckout };

    // Persist checkout state (never raw card data)
    const toStore: PersistedCheckout = {
      currentStep: state.checkout.currentStep,
      selectedProductId: state.checkout.selectedProductId,
      deliveryInfo: state.checkout.deliveryInfo,
      cardTokenId: state.checkout.cardTokenId,
      acceptanceToken: state.checkout.acceptanceToken,
      transactionResult: state.checkout.transactionResult,
    };

    clearPendingPersistTimeout();
    persistTimeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch {
        // localStorage full or unavailable — silently ignore
      } finally {
        persistTimeoutId = null;
      }
    }, PERSIST_DEBOUNCE_MS);

    return result;
  };
