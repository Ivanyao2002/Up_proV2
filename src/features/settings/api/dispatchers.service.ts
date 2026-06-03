import { apiClient } from "@/core/http/apiClient";
import type {
  DispatcherAccountDetail,
  Paginated,
  DispatcherAccount,
} from "@/shared/types";

export type DispatcherPayload = Omit<
  DispatcherAccountDetail,
  "id" | "zone_names" | "franchise_name" | "last_login_at"
> & { password?: string };

export const dispatchersService = {
  list: () => apiClient.get<Paginated<DispatcherAccount>>("/admin/dispatchers"),

  get: (id: string) =>
    apiClient.get<DispatcherAccountDetail>(`/admin/dispatchers/${id}`),

  create: (payload: DispatcherPayload) =>
    apiClient.post<DispatcherAccountDetail>("/admin/dispatchers", payload),

  update: (id: string, payload: Partial<DispatcherPayload>) =>
    apiClient.put<DispatcherAccountDetail>(`/admin/dispatchers/${id}`, payload),

  suspend: (id: string) =>
    apiClient.patch<DispatcherAccountDetail>(`/admin/dispatchers/${id}/suspend`),

  activate: (id: string) =>
    apiClient.patch<DispatcherAccountDetail>(`/admin/dispatchers/${id}/activate`),
};
