import { useQuery, useMutation } from "@tanstack/react-query";
import { pushExpoService } from "./pushExpo.service";

export const pushExpoKeys = {
  all: ["push-expo"] as const,
  config: () => [...pushExpoKeys.all, "config"] as const,
};

export function usePushExpoConfig() {
  return useQuery({
    queryKey: pushExpoKeys.config(),
    queryFn: () => pushExpoService.getConfig(),
  });
}

export function useSendPushTest() {
  return useMutation({
    mutationFn: (payload?: { title?: string; body?: string }) =>
      pushExpoService.sendTest(payload),
  });
}
