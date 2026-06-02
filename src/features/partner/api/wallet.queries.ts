"use client";

import { useQuery } from "@tanstack/react-query";
import { partnerWalletService } from "./wallet.service";

export function usePartnerWallet() {
  return useQuery({
    queryKey: ["partner", "wallet"],
    queryFn: () => partnerWalletService.get(),
  });
}
