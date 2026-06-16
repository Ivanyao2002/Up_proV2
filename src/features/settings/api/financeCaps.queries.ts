import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  financeCapsService,
  type FinanceCapsConfig,
} from "./financeCaps.service";

const QUERY_KEY = ["admin", "settings", "finance-caps"] as const;

export function useFinanceCaps() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => financeCapsService.get(),
  });
}

export function useUpdateFinanceCaps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FinanceCapsConfig) => financeCapsService.update(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
      notificationService.success("Plafonds finance enregistrés");
    },
    onError: () => {
      notificationService.error("Impossible d'enregistrer les plafonds");
    },
  });
}
