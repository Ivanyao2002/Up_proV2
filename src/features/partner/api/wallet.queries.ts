"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerWalletService } from "./wallet.service";
import { notificationService } from "@/core/http/notificationService";

export function usePartnerWallet() {
  return useQuery({
    queryKey: ["partner", "wallet"],
    queryFn: () => partnerWalletService.get(),
  });
}

export function usePartnerWalletWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount_fcfa: number) => partnerWalletService.withdraw(amount_fcfa),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["partner", "wallet"] });
      notificationService.success(data.message);
    },
  });
}
