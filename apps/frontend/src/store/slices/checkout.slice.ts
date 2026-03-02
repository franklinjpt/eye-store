import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type {
  CheckoutStep,
  DeliveryInfo,
  TransactionResult,
  TransactionStatus,
} from '@/types';
import type { RootState } from '@/store';
import {
  createTransaction,
  fetchTransactionStatus,
} from '@/services/api.service';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 10;
const FINAL_STATUSES = new Set<TransactionStatus>([
  'APPROVED',
  'DECLINED',
  'VOIDED',
  'ERROR',
]);
const ABORT_ERROR_NAME = 'AbortError';

function createAbortError(): Error {
  const error = new Error('Polling aborted');
  error.name = ABORT_ERROR_NAME;
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === ABORT_ERROR_NAME;
}

function createPendingResult(transactionId: string): TransactionResult {
  return {
    id: transactionId,
    status: 'PENDING',
    reference: '',
    amountInCents: 0,
    productName: '',
  };
}

async function waitForNextPoll(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    throw createAbortError();
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, POLL_INTERVAL_MS);

    function onAbort() {
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      reject(createAbortError());
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

type CheckoutState = {
  currentStep: CheckoutStep;
  selectedProductId: string | null;
  deliveryInfo: DeliveryInfo | null;
  cardTokenId: string | null;
  acceptanceToken: string | null;
  transactionResult: TransactionResult | null;
  isProcessing: boolean;
  isPolling: boolean;
  error: string | null;
};

const initialState: CheckoutState = {
  currentStep: 'catalog',
  selectedProductId: null,
  deliveryInfo: null,
  cardTokenId: null,
  acceptanceToken: null,
  transactionResult: null,
  isProcessing: false,
  isPolling: false,
  error: null,
};

export const processPayment = createAsyncThunk<
  TransactionResult,
  void,
  { state: RootState }
>(
  'checkout/processPayment',
  async (_, { getState }) => {
    const state = getState();
    const { selectedProductId, cardTokenId, acceptanceToken, deliveryInfo } =
      state.checkout;

    if (
      !selectedProductId ||
      !cardTokenId ||
      !acceptanceToken ||
      !deliveryInfo
    ) {
      throw new Error('Missing payment data');
    }

    const product = state.products.items.find((p) => p.id === selectedProductId);
    if (!product) {
      throw new Error('Product not found');
    }

    return createTransaction({
      productId: selectedProductId,
      tokenId: cardTokenId,
      acceptanceToken,
      customerName: deliveryInfo.fullName,
      customerEmail: deliveryInfo.email,
      deliveryAddress: deliveryInfo.address,
      deliveryCity: deliveryInfo.city,
      customerPhone: deliveryInfo.phone,
    });
  },
);

/**
 * Polls GET /api/transactions/:id every 3s (up to 10 attempts = 30s).
 * Resolves with the final TransactionResult once a non-PENDING status arrives.
 * If all attempts are exhausted it resolves with the last known result (PENDING shown to user).
 */
export const pollTransactionStatus = createAsyncThunk(
  'checkout/pollTransactionStatus',
  async (transactionId: string, { signal }): Promise<TransactionResult> => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await waitForNextPoll(signal);

      try {
        const result = await fetchTransactionStatus(transactionId, signal);
        if (FINAL_STATUSES.has(result.status)) {
          return result;
        }
      } catch (error) {
        if (signal.aborted || isAbortError(error)) {
          throw error;
        }
        // Keep polling for transient errors.
      }
    }

    if (signal.aborted) {
      throw createAbortError();
    }

    try {
      return await fetchTransactionStatus(transactionId, signal);
    } catch (error) {
      if (signal.aborted || isAbortError(error)) {
        throw error;
      }
      return createPendingResult(transactionId);
    }
  },
);

export const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<string>) {
      state.selectedProductId = action.payload;
      state.currentStep = 'payment';
      state.error = null;
    },
    setDeliveryInfo(state, action: PayloadAction<DeliveryInfo>) {
      state.deliveryInfo = action.payload;
    },
    setCardToken(
      state,
      action: PayloadAction<{ tokenId: string; acceptanceToken: string }>,
    ) {
      state.cardTokenId = action.payload.tokenId;
      state.acceptanceToken = action.payload.acceptanceToken;
    },
    goToSummary(state) {
      state.currentStep = 'summary';
    },
    goBackToPayment(state) {
      state.currentStep = 'payment';
    },
    resetCheckout() {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      // ─── processPayment ───────────────────────────────────────────────
      .addCase(processPayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.transactionResult = action.payload;
        // If Wompi responded PENDING, show pending UI and start polling
        if (action.payload.status === 'PENDING') {
          state.isPolling = true;
          state.currentStep = 'result'; // show PENDING result immediately
        } else {
          state.currentStep = 'result';
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.error.message ?? 'Payment failed';
        state.transactionResult = {
          id: '',
          status: 'ERROR',
          reference: '',
          amountInCents: 0,
          productName: '',
        };
        state.currentStep = 'result';
      })
      // ─── pollTransactionStatus ────────────────────────────────────────
      .addCase(pollTransactionStatus.fulfilled, (state, action) => {
        state.isPolling = false;
        state.transactionResult = action.payload;
      })
      .addCase(pollTransactionStatus.rejected, (state) => {
        state.isPolling = false;
      });
  },
});

export const {
  selectProduct,
  setDeliveryInfo,
  setCardToken,
  goToSummary,
  goBackToPayment,
  resetCheckout,
} = checkoutSlice.actions;
