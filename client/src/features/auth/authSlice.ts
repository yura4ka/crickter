import { RootState } from "@/app/store";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { authApi } from "./authApiSlice";

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthState {
  user?: User | null;
  token?: string;
  ucareToken?: string;
  expire?: number;
}

const initialState: AuthState = {};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (_, { payload }: PayloadAction<AuthState>) => payload,
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (_, { payload }) => {
      return payload;
    });
    builder.addMatcher(authApi.endpoints.refresh.matchFulfilled, (_, { payload }) => {
      return payload;
    });
    builder.addMatcher(authApi.endpoints.refresh.matchRejected, () => {
      return { user: null };
    });
    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, () => {
      return { user: null };
    });
  },
});

export const { setCredentials } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
