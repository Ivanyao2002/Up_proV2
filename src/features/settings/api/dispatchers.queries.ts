"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { dispatchersKeys } from "./dispatchers.keys";
import {
  dispatchersService,
  type DispatcherPayload,
} from "./dispatchers.service";

export function useDispatchersList() {
  return useQuery({
    queryKey: dispatchersKeys.list(),
    queryFn: () => dispatchersService.list(),
  });
}

export function useDispatcherDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: dispatchersKeys.detail(id),
    queryFn: () => dispatchersService.get(id),
    enabled: enabled && id !== "new",
  });
}

export function useCreateDispatcher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DispatcherPayload) => dispatchersService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchersKeys.all });
      notificationService.success("Dispatcher créé");
    },
    onError: () => notificationService.error("Impossible de créer le dispatcher"),
  });
}

export function useUpdateDispatcher(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DispatcherPayload>) =>
      dispatchersService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchersKeys.all });
      notificationService.success("Modifications enregistrées");
    },
    onError: () => notificationService.error("Enregistrement impossible"),
  });
}

export function useSuspendDispatcher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dispatchersService.suspend(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchersKeys.all });
      notificationService.success("Compte suspendu");
    },
  });
}

export function useActivateDispatcher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dispatchersService.activate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchersKeys.all });
      notificationService.success("Compte réactivé");
    },
  });
}
