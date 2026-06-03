"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { partnersKeys } from "./partners.keys";
import { partnersService, type PartnerCreatePayload } from "./partners.service";

export function usePartnersList() {
  return useQuery({
    queryKey: partnersKeys.list(),
    queryFn: () => partnersService.listAdmin(),
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PartnerCreatePayload) => partnersService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnersKeys.all });
      notificationService.success("Partenaire créé");
    },
    onError: () => notificationService.error("Création impossible"),
  });
}
