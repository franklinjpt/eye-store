import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type {
  CheckoutStep,
  DeliveryInfo,
  TransactionResult,
  Product,
} from '@/types';
import {
  createTransaction,
  fetchTransactionStatus,
} from '@/services/api.service';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 10;
const FINAL_STATUSES = new Set(['APPROVED', 'DECLINED', 'VOIDED', 'ERROR']);

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

type StoreState = {
  checkout: CheckoutState;
  products: { items: Product[] };
};

export const processPayment = createAsyncThunk(
  'checkout/processPayment',
  async (_, { getState }) => {
    const state = getState() as StoreState;
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

    const product = state.products.items.find(
      (p: Product) => p.id === selectedProductId,
    );
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
  async (transactionId: string): Promise<TransactionResult> => {
    return new Promise((resolve) => {
      let attempts = 0;

      const interval = setInterval(async () => {
        attempts++;
        try {
          const result = await fetchTransactionStatus(transactionId);
          console.log(
            `[poll attempt ${attempts}] transactionId: ${transactionId} — status: ${result.status}`,
          );
          if (FINAL_STATUSES.has(result.status)) {
            console.log(
              `[poll] Final status reached: ${result.status}. Stopping.`,
            );
            clearInterval(interval);
            resolve(result);
            return;
          }
          console.log(
            `[poll] Status is still PENDING, will retry (attempt ${attempts}/${MAX_POLL_ATTEMPTS})`,
          );
        } catch (err) {
          console.warn(
            `[poll attempt ${attempts}] Network error fetching transaction status:`,
            err,
          );
          // swallow network errors and keep polling
        }

        if (attempts >= MAX_POLL_ATTEMPTS) {
          console.warn(
            `[poll] Max attempts (${MAX_POLL_ATTEMPTS}) reached for ${transactionId}. Stopping with last known status.`,
          );
          clearInterval(interval);
          // Resolve with the last fetched or an explicit PENDING result
          resolve(
            await fetchTransactionStatus(transactionId).catch(() => ({
              id: transactionId,
              status: 'PENDING' as const,
              reference: '',
              amountInCents: 0,
              productName: '',
            })),
          );
        }
      }, POLL_INTERVAL_MS);
    });
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
