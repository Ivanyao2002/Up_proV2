import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { useAuthStore } from "@/core/auth/authStore";
import type { ListParams } from "@/shared/types/listParams";
import { disputeService } from "./dispute.service";
import { disputeKeys } from "./dispute.keys";
import type { DisputeDetail } from "./dispute.types";

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
  const agentName = useAuthStore((s) => s.user?.name);
  return useMutation({
    mutationFn: (content: string) => disputeService.sendMessage(id, content),
    onSuccess: (res, content) => {
      // Bug 1 backend : invalider le détail rejouerait `GET /v1/disputes/:id` qui
      // ne renvoie pas `messages` → fil vidé. On ajoute donc le message envoyé
      // directement au cache ; l'écho socket (même id) est dédupliqué côté listener.
      qc.setQueryData<DisputeDetail>(disputeKeys.detail(id), (prev) =>
        prev && res?.id && !prev.messages.some((m) => m.id === res.id)
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: res.id,
                  sender: "agent",
                  sender_name: agentName ?? "Agent",
                  content,
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : prev
      );
      void qc.invalidateQueries({ queryKey: ["disputes", "list"] });
    },
    onError: () => notificationService.error("Échec de l'envoi du message."),
  });
}

/**
 * Patche le statut dans le cache détail au lieu d'invalider — sinon le refetch
 * `GET /v1/disputes/:id` (sans `messages`, Bug 1 backend) viderait le fil.
 */
function patchDisputeStatus(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  status: DisputeDetail["status"]
) {
  qc.setQueryData<DisputeDetail>(disputeKeys.detail(id), (prev) =>
    prev ? { ...prev, status, updated_at: new Date().toISOString() } : prev
  );
  void qc.invalidateQueries({ queryKey: ["disputes", "list"] });
}

export function useResolveDispute(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => disputeService.resolve(id),
    onSuccess: () => {
      patchDisputeStatus(qc, id, "resolved");
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
      patchDisputeStatus(qc, id, "closed");
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
      patchDisputeStatus(qc, id, "escalated");
      notificationService.success("Litige escaladé — transmis au niveau supérieur.");
    },
    onError: () => notificationService.error("Impossible d'escalader ce litige."),
  });
}
