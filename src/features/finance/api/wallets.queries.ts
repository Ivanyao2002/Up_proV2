"use client";

import { useQuery } from "@tanstack/react-query";
import { walletsService } from "./wallets.service";

export function useWalletsList() {
  return useQuery({
    queryKey: ["finance", "wallets"],
    queryFn: () => walletsService.list(),
  });
}
