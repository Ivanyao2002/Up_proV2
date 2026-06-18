import type { PortalRole } from "@/shared/types";

export const LOGIN_BY_PORTAL: Record<PortalRole, string> = {
  admin: "/admin/login",
  partner: "/partner/login",
  franchise: "/franchise/login",
  dispatch: "/dispatch/login",
};

export const DASHBOARD_BY_PORTAL: Record<PortalRole, string> = {
  admin: "/admin/dashboard",
  partner: "/partner/dashboard",
  franchise: "/franchise/dashboard",
  dispatch: "/dispatch/console",
};
