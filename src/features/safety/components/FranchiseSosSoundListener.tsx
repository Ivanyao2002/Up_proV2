"use client";

import { franchiseSosKeys } from "@/features/franchise/api/franchiseSos.queries";
import { franchiseSosService } from "@/features/franchise/api/franchiseSos.service";
import { useSosIncomingSound } from "../hooks/useSosIncomingSound";

export function FranchiseSosSoundListener() {
  useSosIncomingSound({
    dashboardQueryKey: franchiseSosKeys.dashboard(),
    dashboardQueryFn: () => franchiseSosService.getDashboard(),
  });

  return null;
}
