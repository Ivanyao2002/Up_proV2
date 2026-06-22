"use client";

import { usePathname } from "next/navigation";
import type { ComptaApiScope } from "./comptaApiScope";

export function useComptaApiScope(): ComptaApiScope {
  const pathname = usePathname();
  return pathname.startsWith("/compta") ? "portal" : "admin";
}
