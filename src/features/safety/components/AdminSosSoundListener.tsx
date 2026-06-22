"use client";

import { sosKeys } from "../api/sos.keys";
import { sosService } from "../api/sos.service";
import { useSosIncomingSound } from "../hooks/useSosIncomingSound";

export function AdminSosSoundListener() {
  useSosIncomingSound({
    dashboardQueryKey: sosKeys.dashboard(),
    dashboardQueryFn: () => sosService.getDashboard(),
  });

  return null;
}
