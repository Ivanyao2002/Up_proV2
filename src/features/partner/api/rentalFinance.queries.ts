"use client";

import { useQuery } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { partnerRentalFinanceService } from "./rentalFinance.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerRentalFinanceKeys = {
  all: ["partner", "rental-finance"] as const,
  summary: () => [...partnerRentalFinanceKeys.all, "summary"] as const,
  settlements: (filters?: ListParams) =>
    [...partnerRentalFinanceKeys.all, "settlements", filters] as const,
};

export function usePartnerRentalFinanceSummary() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalFinanceKeys.summary(),
    queryFn: () => partnerRentalFinanceService.summary(ownerId!),
    enabled: ownerId != null,
  });
}

export function usePartnerRentalSettlements(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRentalFinanceKeys.settlements(params),
    queryFn: () => partnerRentalFinanceService.settlements(ownerId!, params),
    enabled: ownerId != null,
  });
}
