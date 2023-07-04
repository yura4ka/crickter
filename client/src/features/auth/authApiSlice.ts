import { apiSlice } from "@/app/api/apiSlice";
import { AuthState } from "./authSlice";

export interface LoginRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<Required<AuthState>, LoginRequest>({
      query: (credentials) => ({
        url: "login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<{ id: string }, RegisterRequest>({
      query: (credentials) => ({
        url: "register",
        method: "POST",
        body: credentials,
      }),
    }),
  }),
});
