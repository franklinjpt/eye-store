import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Product } from '@/types';
import { fetchProducts } from '@/services/api.service';

type ProductsState = {
  items: Product[];
  loading: boolean;
  error: string | null;
};

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
};

export const loadProducts = createAsyncThunk('products/load', async () => {
  return fetchProducts();
});

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    updateProductStock(state, action: { payload: { productId: string; stock: number } }) {
      const product = state.items.find((p) => p.id === action.payload.productId);
      if (product) {
        product.stock = action.payload.stock;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load products';
      });
  },
});

export const { updateProductStock } = productsSlice.actions;
