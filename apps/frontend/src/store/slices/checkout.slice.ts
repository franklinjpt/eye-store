import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { CheckoutStep, DeliveryInfo, TransactionResult, Product } from '@/types';
import { createTransaction } from '@/services/api.service';

type CheckoutState = {
  currentStep: CheckoutStep;
  selectedProductId: string | null;
  deliveryInfo: DeliveryInfo | null;
  cardTokenId: string | null;
  acceptanceToken: string | null;
  transactionResult: TransactionResult | null;
  isProcessing: boolean;
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
    const { selectedProductId, cardTokenId, acceptanceToken, deliveryInfo } = state.checkout;

    if (!selectedProductId || !cardTokenId || !acceptanceToken || !deliveryInfo) {
      throw new Error('Missing payment data');
    }

    const product = state.products.items.find((p: Product) => p.id === selectedProductId);
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
    setCardToken(state, action: PayloadAction<{ tokenId: string; acceptanceToken: string }>) {
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
      .addCase(processPayment.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.transactionResult = action.payload;
        state.currentStep = 'result';
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
