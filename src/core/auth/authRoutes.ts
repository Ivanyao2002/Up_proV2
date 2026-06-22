import type { PortalRole } from "@/shared/types";

export const LOGIN_BY_PORTAL: Record<PortalRole, string> = {
  admin: "/admin/login",
  compta: "/compta/login",
  support: "/support/login",
  reporting: "/reporting/login",
  partner: "/partner/login",
  franchise: "/franchise/login",
  dispatch: "/dispatch/login",
};

export const DASHBOARD_BY_PORTAL: Record<PortalRole, string> = {
  admin: "/admin/dashboard",
  compta: "/compta",
  support: "/support",
  reporting: "/reporting",
  partner: "/partner/dashboard",
  franchise: "/franchise/dashboard",
  dispatch: "/dispatch/console",
};

/** Portails siège : un compte admin peut s'y connecter sans changer de rôle API. */
export const ADMIN_ALSO_ALLOWED_ON: Partial<Record<PortalRole, PortalRole[]>> = {
  compta: ["admin"],
  support: ["admin"],
  reporting: ["admin"],
};

export function canAccessPortal(
  userRole: PortalRole,
  targetPortal: PortalRole
): boolean {
  if (userRole === targetPortal) return true;
  return ADMIN_ALSO_ALLOWED_ON[targetPortal]?.includes(userRole) ?? false;
}
