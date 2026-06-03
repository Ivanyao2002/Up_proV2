"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { disputesService, type ResolveDisputePayload } from "./disputes.service";

export function useDisputeDetail(id: string) {
  return useQuery({
    queryKey: ["support", "disputes", id],
    queryFn: () => disputesService.get(id),
    enabled: Boolean(id),
  });
}

export function useResolveDispute(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: ResolveDisputePayload) => disputesService.resolve(id, payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["support", "disputes", id] });
      void qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      notificationService.success(data.message);
    },
  });
}
