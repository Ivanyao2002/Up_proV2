import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { ListParams } from "@/shared/types/listParams";
import { disputeService } from "./dispute.service";
import { disputeKeys } from "./dispute.keys";

export function useDisputesList(params?: ListParams) {
  return useQuery({
    queryKey: disputeKeys.list(params),
    queryFn:  () => disputeService.list(params),
  });
}

export function useDisputeDetail(id: string) {
  return useQuery({
    queryKey: disputeKeys.detail(id),
    queryFn:  () => disputeService.getById(id),
    enabled:  !!id,
  });
}

export function useAssignDispute(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => disputeService.assign(id),
    onSuccess: (data) => {
      qc.setQueryData(disputeKeys.detail(id), data);
      qc.invalidateQueries({ queryKey: disputeKeys.list() });
      notificationService.success("Litige pris en charge.");
    },
    onError: () => notificationService.error("Impossible de prendre en charge ce litige."),
  });
}

export function useSendDisputeMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => disputeService.sendMessage(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: disputeKeys.detail(id) }),
    onError: () => notificationService.error("Échec de l'envoi du message."),
  });
}

export function useResolveDispute(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => disputeService.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.detail(id) });
      qc.invalidateQueries({ queryKey: disputeKeys.list() });
      notificationService.success("Litige marqué comme résolu.");
    },
    onError: () => notificationService.error("Impossible de résoudre ce litige."),
  });
}

export function useCloseDispute(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => disputeService.close(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.detail(id) });
      qc.invalidateQueries({ queryKey: disputeKeys.list() });
      notificationService.success("Litige clôturé.");
    },
    onError: () => notificationService.error("Impossible de clôturer ce litige."),
  });
}

export function useEscalateDispute(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => disputeService.escalate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disputeKeys.detail(id) });
      qc.invalidateQueries({ queryKey: disputeKeys.list() });
      notificationService.success("Litige escaladé — transmis au niveau supérieur.");
    },
    onError: () => notificationService.error("Impossible d'escalader ce litige."),
  });
}
