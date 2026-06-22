"use client";

import { useScope } from "@/core/auth/useScope";
import { partnerSosKeys } from "@/features/partner/api/partnerSos.queries";
import { partnerSosService } from "@/features/partner/api/partnerSos.service";
import { useSosIncomingSound } from "../hooks/useSosIncomingSound";

export function PartnerSosSoundListener() {
  const { ownerId } = useScope();

  useSosIncomingSound({
    dashboardQueryKey: partnerSosKeys.dashboard(),
    dashboardQueryFn: () => partnerSosService.getDashboard(ownerId!),
    enabled: ownerId != null,
  });

  return null;
}
