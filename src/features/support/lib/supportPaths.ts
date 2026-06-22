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
    chat: `${base}/chat`,
    chatDetail: (id: string) => `${base}/chat/${id}`,
    disputeDetail: (id: string) => `${base}/disputes/${id}`,
    anomalies: `${base}/anomalies`,
    anomaliesAudit: `${base}/anomalies/audit`,
    tripForensic: (orderId: string) => `/admin/ops/trips/${orderId}/forensic`,
  };
}

export function useSupportPaths() {
  const pathname = usePathname();
  return buildSupportPaths(supportBaseFromPathname(pathname));
}
