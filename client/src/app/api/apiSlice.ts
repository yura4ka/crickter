import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { AuthState, setCredentials } from "@/features/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8000",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithAuth: typeof baseQuery = async (args, api, endpoints) => {
  let result = await baseQuery(args, api, endpoints);

  if (result.error?.status === 403) {
    const refreshResult = await baseQuery("auth/refresh", api, endpoints);
    if (refreshResult.data) {
      api.dispatch(setCredentials(refreshResult.data as Required<AuthState>));
      result = await baseQuery(args, api, endpoints);
    } else {
      api.dispatch(setCredentials({ token: undefined, user: null }));
    }
  }

  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithAuth,
  endpoints: () => ({}),
});
