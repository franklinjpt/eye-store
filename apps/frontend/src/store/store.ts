import { configureStore } from '@reduxjs/toolkit';
import { productsSlice } from './slices/products.slice';
import { checkoutSlice } from './slices/checkout.slice';
import { uiSlice } from './slices/ui.slice';
import { localStorageMiddleware, loadPersistedState } from './middleware/local-storage.middleware';

export const store = configureStore({
  reducer: {
    products: productsSlice.reducer,
    checkout: checkoutSlice.reducer,
    ui: uiSlice.reducer,
  },
  preloadedState: loadPersistedState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
