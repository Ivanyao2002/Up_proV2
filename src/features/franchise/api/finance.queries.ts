"use client";

import { useQuery } from "@tanstack/react-query";
import { franchiseFinanceService } from "./finance.service";

export const franchiseFinanceKeys = {
  all: ["franchise", "finance"] as const,
};

export function useFranchiseFinance() {
  return useQuery({
    queryKey: franchiseFinanceKeys.all,
    queryFn: () => franchiseFinanceService.get(),
  });
}
