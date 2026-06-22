"use client";

import { useQuery } from "@tanstack/react-query";
import { useComptaApiScope } from "@/features/compta/api/useComptaApiScope";
import { walletsService } from "./wallets.service";
import type { ListParams } from "@/shared/types/listParams";

export const walletsKeys = {
  all: ["finance", "wallets"] as const,
  list: (scope: string, filters?: ListParams) =>
    [...walletsKeys.all, "list", scope, filters] as const,
};

export function useWalletsList(params?: ListParams) {
  const scope = useComptaApiScope();
  return useQuery({
    queryKey: walletsKeys.list(scope, params),
    queryFn: () => walletsService.list(params),
  });
}
