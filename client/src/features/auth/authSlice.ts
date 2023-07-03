import { RootState } from "@/app/store";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

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
      state = action.payload;
    },
    logOut: () => initialState,
  },
});

export const { setCredentials, logOut } = authSlice.actions;

export const selectUser = (state: RootState) => state.auth.user;

export default authSlice.reducer;
