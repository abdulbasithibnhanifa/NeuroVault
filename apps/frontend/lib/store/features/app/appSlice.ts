import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  sidebarOpen: boolean;
  activeDocumentId: string | null;
}

const initialState: AppState = {
  sidebarOpen: true,
  activeDocumentId: null,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setActiveDocument: (state, action: PayloadAction<string | null>) => {
      state.activeDocumentId = action.payload;
    },
  },
});

export const { toggleSidebar, setActiveDocument } = appSlice.actions;

export default appSlice.reducer;
