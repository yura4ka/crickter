import { RootState } from "@/app/store";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { authApiSlice } from "./authApiSlice";

export interface AuthState {
  user?: {
    email: string;
    username: string;
  };
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
    logOut: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApiSlice.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.token = payload.token;
        state.user = payload.user;
      }
    );
  },
});

export const { setCredentials, logOut } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;

export default authSlice.reducer;
