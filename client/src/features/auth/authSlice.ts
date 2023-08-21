import { RootState } from "@/app/store";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { authApi } from "./authApiSlice";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
}

export interface AuthState {
  user?: User | null;
  token?: string;
}

const initialState: AuthState = {
  user: undefined,
  token: undefined,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthState>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.token = payload.token;
      state.user = payload.user;
    });
    builder.addMatcher(authApi.endpoints.refresh.matchFulfilled, (state, { payload }) => {
      state.token = payload.token;
      state.user = payload.user;
    });
    builder.addMatcher(authApi.endpoints.refresh.matchRejected, (state) => {
      state.token = undefined;
      state.user = null;
    });
    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
      state.token = undefined;
      state.user = null;
    });
  },
});

export const { setCredentials } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;

export default authSlice.reducer;
