import { apiClient } from "@/core/http/apiClient";
import type { AuthSession, User } from "@/shared/types";

export type LoginPortal = "admin" | "partner" | "franchise";

export interface LoginPayload {
  portal: LoginPortal;
  email: string;
  password: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthSession>("/auth/login", payload),

  me: () => apiClient.get<User>("/me"),

  logout: () => apiClient.post<{ ok: boolean }>("/auth/logout"),
};
