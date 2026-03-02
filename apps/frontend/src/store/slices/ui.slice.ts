import { createSlice } from '@reduxjs/toolkit';

type UiState = {
  isModalOpen: boolean;
};

const initialState: UiState = {
  isModalOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openModal(state) {
      state.isModalOpen = true;
    },
    closeModal(state) {
      state.isModalOpen = false;
    },
  },
});

export const { openModal, closeModal } = uiSlice.actions;
