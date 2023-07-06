import { api } from "@/app/api/apiSlice";
import { AuthState } from "./authSlice";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<Required<AuthState>, LoginRequest>({
      query: (credentials) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<{ id: string }, RegisterRequest>({
      query: (credentials) => ({
        url: "auth/register",
        method: "POST",
        body: credentials,
      }),
    }),
    refresh: builder.query<Required<AuthState>, undefined>({
      query: () => ({ url: "auth/refresh" }),
    }),
    checkEmail: builder.mutation<undefined, string>({
      query: (email) => ({
        url: "auth/checkEmail",
        method: "POST",
        body: { email },
        responseHandler: (response) => response.text(),
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshQuery,
  useCheckEmailMutation,
} = authApi;
