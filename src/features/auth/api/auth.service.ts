import { apiClient } from "@/core/http/apiClient";
import { env } from "@/core/config/env";
import { useAuthStore } from "@/core/auth/authStore";
import { LINKS } from "@/core/api/links";
import type { AuthSession, PortalRole, User } from "@/shared/types";
import type {
  ApiAuthLoginBody,
  ApiAuthLoginResponse,
  ApiAuthMeResponse,
} from "./auth.types";
import { mapApiLoginToAuthSession, mapApiMeToUser } from "./auth.mapper";

export type LoginPortal = "admin" | "partner" | "franchise" | "dispatch";

export interface LoginPayload {
  portal: LoginPortal;
  email: string;
  password: string;
}

const V1_LOGIN_BY_PORTAL: Record<LoginPortal, string> = {
  /** Route admin unique — rôle déduit via `profiles.user_type` (pas /auth/partner|franchise/login) */
  admin: LINKS.auth.v1.login,
  partner: LINKS.auth.v1.login,
  franchise: LINKS.auth.v1.login,
  dispatch: LINKS.auth.v1.driverLogin,
};

function useLegacyAuth(): boolean {
  return env.useMocks && !env.useRealAuth;
}

async function loginV1(payload: LoginPayload): Promise<AuthSession> {
  const endpoint = V1_LOGIN_BY_PORTAL[payload.portal];
  const body: ApiAuthLoginBody = {
    email: payload.email.trim(),
    password: payload.password,
  };

  const data = await apiClient.post<ApiAuthLoginResponse>(endpoint, body);
  return mapApiLoginToAuthSession(data, payload.portal);
}

async function loginLegacy(payload: LoginPayload): Promise<AuthSession> {
  return apiClient.post<AuthSession>(LINKS.auth.legacy.login, payload);
}

async function meV1(portal: PortalRole): Promise<User> {
  const data = await apiClient.get<ApiAuthMeResponse>(LINKS.auth.v1.me);
  return mapApiMeToUser(data, portal);
}

export const authService = {
  login: (payload: LoginPayload) =>
    useLegacyAuth() ? loginLegacy(payload) : loginV1(payload),

  me: () => {
    if (useLegacyAuth()) {
      return apiClient.get<User>(LINKS.auth.legacy.me);
    }
    const portal = useAuthStore.getState().user?.role ?? "admin";
    return meV1(portal);
  },

  logout: () =>
    apiClient.post<{ ok?: boolean; status?: string }>(
      useLegacyAuth() ? LINKS.auth.legacy.logout : LINKS.auth.v1.logout
    ),

  forgotPassword: (email: string, portal: LoginPortal) =>
    apiClient.post<{ ok: boolean; message: string }>(
      useLegacyAuth()
        ? LINKS.auth.legacy.forgotPassword
        : LINKS.auth.v1.forgotPassword,
      useLegacyAuth() ? { email, portal } : { email: email.trim() }
    ),
};
