import type { PortalRole } from "@/shared/types";
import { LOGIN_BY_PORTAL } from "./authRoutes";

const PORTAL_PREFIX: Record<PortalRole, string> = {
  admin: "/admin",
  compta: "/compta",
  support: "/support",
  reporting: "/reporting",
  partner: "/partner",
  franchise: "/franchise",
  dispatch: "/dispatch",
};

/** Valide une URL interne de retour après login (évite open redirect). */
export function resolveReturnUrl(
  from: string | null | undefined,
  fallback: string,
  portal: PortalRole
): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return fallback;
  }

  const basePrefix = PORTAL_PREFIX[portal];
  const allowedPrefixes =
    portal === "admin"
      ? [basePrefix, "/compta", "/support", "/reporting"]
      : [basePrefix];
  if (!allowedPrefixes.some((prefix) => from.startsWith(prefix))) {
    return fallback;
  }

  const loginPath = LOGIN_BY_PORTAL[portal];
  if (from === loginPath || from.startsWith(`${loginPath}?`)) {
    return fallback;
  }
  for (const path of Object.values(LOGIN_BY_PORTAL)) {
    if (from === path || from.startsWith(`${path}?`)) {
      return fallback;
    }
  }

  return from;
}

export function buildLoginUrlWithReturn(
  loginPath: string,
  returnPath?: string
): string {
  if (!returnPath) return loginPath;
  const params = new URLSearchParams();
  params.set("from", returnPath);
  return `${loginPath}?${params.toString()}`;
}

export function readReturnUrlFromLocation(
  fallback: string,
  portal: PortalRole
): string {
  if (typeof window === "undefined") return fallback;
  const from = new URLSearchParams(window.location.search).get("from");
  return resolveReturnUrl(from, fallback, portal);
}
