"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerProfileService } from "./profile.service";
import { notificationService } from "@/core/http/notificationService";

export const partnerProfileKeys = {
  all: ["partner", "profile"] as const,
};

export function usePartnerProfile() {
  return useQuery({
    queryKey: partnerProfileKeys.all,
    queryFn: () => partnerProfileService.get(),
  });
}

export function useUpdatePartnerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof partnerProfileService.update>[0]) =>
      partnerProfileService.update(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerProfileKeys.all });
      notificationService.success("Profil mis à jour");
    },
    onError: () => {
      notificationService.error("Échec de la mise à jour");
    },
  });
}
