import { env } from "@/core/config/env";
import { clearAuthCookie } from "@/core/auth/authCookie";
import { LOGIN_BY_PORTAL } from "@/core/auth/authRoutes";
import { buildLoginUrlWithReturn } from "@/core/auth/returnUrl";
import { useAuthStore } from "@/core/auth/authStore";
import { AppError, AuthError, NetworkError } from "./errorHandler";

/**
 * Préfixe same-origin : les requêtes navigateur passent par le rewrite Next.js
 * (`/upjunoo-api/*` → API distante) car le CORS live n'autorise que GET/HEAD/POST
 * (PATCH/PUT/DELETE bloqués en preflight — voir CORS-01).
 */
const API_PROXY_SUFFIX = "/upjunoo-api";

/** Préfixe same-origin du proxy API (inclut basePath si défini, ex. /pro/upjunoo-api). */
export function getBrowserApiProxyPrefix(): string {
  return `${env.basePath}${API_PROXY_SUFFIX}`;
}

/** @deprecated Préférer getBrowserApiProxyPrefix() — conservé pour compat. */
export const BROWSER_API_PROXY_PREFIX = API_PROXY_SUFFIX;

function getRequestApiOrigin(): string {
  if (typeof window !== "undefined") {
    return getBrowserApiProxyPrefix();
  }
  return env.apiUrl.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  return `${getRequestApiOrigin()}/api/v2`;
}

export function getApiV1BaseUrl(): string {
  return `${getRequestApiOrigin()}/v1`;
}

/** Résout l'URL complète selon le préfixe du chemin (v1 auth vs api/v2 back-office). */
export function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const origin = getRequestApiOrigin();
  if (path.startsWith("/v1/")) {
    return `${origin}${path}`;
  }
  return `${origin}/api/v2${path}`;
}

async function createHeaders(
  customHeaders: Record<string, string> = {},
  isAuthRequest = false,
  withJsonBody = false
): Promise<Record<string, string>> {
  const { token } = useAuthStore.getState();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Client-Type": "back-office",
    ...customHeaders,
  };

  if (withJsonBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !isAuthRequest) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { user } = useAuthStore.getState();
  if (user && !isAuthRequest) {
    headers["X-Scope"] = user.scope;
    if (user.franchise_id != null) {
      headers["X-Franchise-Id"] = String(user.franchise_id);
    }
    if (user.owner_id != null) {
      headers["X-Owner-Id"] = String(user.owner_id);
    }
  }

  return headers;
}

/** Routes auth publiques (login portail, mot de passe oublié, OTP, refresh). */
function isPublicAuthEndpoint(endpoint: string): boolean {
  if (!endpoint.includes("/auth/")) return false;
  return (
    endpoint.includes("/login") ||
    endpoint.includes("/forgot") ||
    endpoint.includes("/otp/") ||
    endpoint.includes("/refresh")
  );
}

export async function fetchClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  /** Routes publiques : pas de Bearer (logout/me nécessitent le JWT). */
  const isAuthRequest = isPublicAuthEndpoint(endpoint);

  try {
    const hasJsonBody =
      options.body != null &&
      options.body !== "" &&
      !(typeof options.body === "string" && options.body.trim() === "");

    const headers = await createHeaders(
      options.headers as Record<string, string>,
      isAuthRequest,
      hasJsonBody
    );

    const url = resolveApiUrl(endpoint);

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && !isAuthRequest) {
      const role = useAuthStore.getState().user?.role;
      useAuthStore.getState().clearSession();
      clearAuthCookie();
      if (typeof window !== "undefined") {
        const loginPath =
          LOGIN_BY_PORTAL[role as keyof typeof LOGIN_BY_PORTAL] ?? "/login";
        window.location.href = buildLoginUrlWithReturn(
          loginPath,
          window.location.pathname
        );
      }
      throw new AuthError("Session expirée. Veuillez vous reconnecter.");
    }

    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "TypeError") {
      throw new NetworkError();
    }
    throw new AppError("Erreur lors de la requête", "FETCH_ERROR");
  }
}

export default fetchClient;
