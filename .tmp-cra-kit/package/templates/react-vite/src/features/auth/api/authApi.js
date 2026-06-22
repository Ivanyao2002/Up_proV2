import { apiSlice } from "@/core/api/apiSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "",
        method: "POST",
        body: credentials,
      }),
    }),

    me: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
    }),

    logout: builder.query({
      query: (token) => ({
        url: "",
        method: "POST",
        body: token,
      }),
    }),
  }),
});
