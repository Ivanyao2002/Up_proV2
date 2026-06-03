"use client";

import { useQuery } from "@tanstack/react-query";
import {
  commissionsService,
  reconciliationService,
} from "./commissions.service";

export function useCommissionsList() {
  return useQuery({
    queryKey: ["finance", "commissions"],
    queryFn: () => commissionsService.list(),
  });
}

export function useReconciliationList() {
  return useQuery({
    queryKey: ["finance", "reconciliation"],
    queryFn: () => reconciliationService.list(),
  });
}
