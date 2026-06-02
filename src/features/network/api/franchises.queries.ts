"use client";

import { useQuery } from "@tanstack/react-query";
import { franchisesKeys } from "./franchises.keys";
import { franchisesService } from "./franchises.service";

export function useFranchisesList() {
  return useQuery({
    queryKey: franchisesKeys.list(),
    queryFn: () => franchisesService.listAdmin(),
  });
}
