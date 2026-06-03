"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { clientsService } from "./clients.service";

export function useClientsList() {
  return useQuery({
    queryKey: ["fleet", "clients"],
    queryFn: () => clientsService.list(),
  });
}

export function useClientDetail(id: string) {
  return useQuery({
    queryKey: ["fleet", "clients", id],
    queryFn: () => clientsService.get(id),
    enabled: Boolean(id),
  });
}

export function useSuspendClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clientsService.suspend(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["fleet", "clients", id] });
      void qc.invalidateQueries({ queryKey: ["fleet", "clients"] });
      notificationService.success(data.message);
    },
  });
}

export function useActivateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clientsService.activate(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["fleet", "clients", id] });
      void qc.invalidateQueries({ queryKey: ["fleet", "clients"] });
      notificationService.success(data.message);
    },
  });
}