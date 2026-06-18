import { http } from "./axiosInstance";

export const axiosBaseQuery = async ({
  url,
  method,
  body,
  params,
  headers,
}) => {
  try {
    const result = await http({
      url,
      method,
      body,
      params,
      headers,
    });

    return { data: result.data };
  } catch (error) {
    return {
      error: {
        status: error.response?.status,
        data: error.response?.data || error.message,
      },
    };
  }
};
