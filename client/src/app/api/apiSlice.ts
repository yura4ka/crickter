import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query";
import { RootState } from "../store";
import { AuthState, logOut, setCredentials } from "@/features/auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:8080",
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
    const refreshResult = await baseQuery("/refresh", api, endpoints);
    if (refreshResult.data) {
      api.dispatch(setCredentials(refreshResult.data as Required<AuthState>));
      result = await baseQuery(args, api, endpoints);
    } else {
      api.dispatch(logOut());
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth,
  endpoints: () => ({}),
});
