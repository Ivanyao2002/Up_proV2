import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: "Ange Kadio",
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      state.isAuthenticated = true;
    },
    updateTokens: (state, { payload }) => {
      state.accessToken = payload.accessToken;
      if (payload.refreshToken) {
        state.refreshToken = payload.refreshToken; // si rotation token côté serveur
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, updateTokens, clearCredentials } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
