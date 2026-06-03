import { apiClient } from "@/core/http/apiClient";
import type { DispatchRules } from "@/shared/types";

export const dispatchRulesService = {
  get: () => apiClient.get<DispatchRules>("/admin/settings/dispatch-rules"),

  update: (payload: Partial<DispatchRules>) =>
    apiClient.put<DispatchRules>("/admin/settings/dispatch-rules", payload),
};
