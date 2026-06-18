import { parseApiErrorMessage } from "@/shared/utils/parseApiError";
import { isRejectedWithValue } from "@reduxjs/toolkit";
import { toast } from "sonner";

export const reduxQueryErrorMiddleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const error = action.payload;
    const status = error?.status;

    if (status === 401 || status === 404) {
      return next(action);
    }

    const message = parseApiErrorMessage(action.payload);

    toast.dismiss();
    toast.error(message);
  }

  return next(action);
};
