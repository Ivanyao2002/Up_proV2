import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../http/axiosBaseQuery";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});
