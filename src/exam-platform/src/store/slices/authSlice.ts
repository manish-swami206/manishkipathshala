import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  userId: string | null;
  isAdmin: boolean;
  isLoaded: boolean;
  permissions: string[];
}

const initialState: AuthState = {
  userId: null,
  isAdmin: false,
  isLoaded: false,
  permissions: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ userId: string | null; isAdmin: boolean; permissions?: string[] }>) {
      state.userId = action.payload.userId;
      state.isAdmin = action.payload.isAdmin;
      state.permissions = action.payload.permissions ?? [];
      state.isLoaded = true;
    },
    clearAuth(state) {
      state.userId = null;
      state.isAdmin = false;
      state.permissions = [];
      state.isLoaded = true;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
