import { env } from "@/core/config/env";
import { useAuthStore } from "@/core/auth/authStore";
import { AppError, AuthError, NetworkError } from "./errorHandler";

const API_BASE = `${env.apiUrl}/api/v2`;

export function getApiBaseUrl(): string {
  return API_BASE;
}

async function createHeaders(
  customHeaders: Record<string, string> = {},
  isAuthRequest = false
): Promise<Record<string, string>> {
  const { token } = useAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Type": "back-office",
    ...customHeaders,
  };

  if (token && !isAuthRequest) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const isAuthRequest =
    endpoint.includes("/auth/login") || endpoint.includes("/auth/logout");

  try {
    const headers = await createHeaders(
      options.headers as Record<string, string>,
      isAuthRequest
    );

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && !isAuthRequest) {
      useAuthStore.getState().clearSession();
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
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
