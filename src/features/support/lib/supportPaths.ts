"use client";

import { usePathname } from "next/navigation";

export type SupportBasePath = "/admin/support" | "/support";

export function supportBaseFromPathname(pathname: string): SupportBasePath {
  return pathname.startsWith("/support") ? "/support" : "/admin/support";
}

export function buildSupportPaths(base: SupportBasePath) {
  return {
    base,
    dashboard: base === "/support" ? "/support" : "/admin/dashboard",
    tickets: `${base}/tickets`,
    ticketDetail: (id: string) => `${base}/tickets/${id}`,
    chat: `${base}/chat`,
    chatDetail: (id: string) => `${base}/chat/${id}`,
    anomalies: `${base}/anomalies`,
    anomaliesAudit: `${base}/anomalies/audit`,
  };
}

export function useSupportPaths() {
  const pathname = usePathname();
  return buildSupportPaths(supportBaseFromPathname(pathname));
}
