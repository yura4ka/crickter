import { RootState } from "@/app/store";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { authApi } from "./authApiSlice";

export interface AuthState {
  user?: {
    email: string;
    username: string;
  } | null;
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
    setCredentials: (state, action: PayloadAction<Required<AuthState>>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logOut: (state) => {
      state.token = undefined;
      state.user = null;
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
  },
});

export const { setCredentials, logOut } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;

export default authSlice.reducer;
