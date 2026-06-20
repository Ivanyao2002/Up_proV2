"use client";

import { useQuery } from "@tanstack/react-query";
import { supportTicketsService } from "./tickets.service";
import type { ListParams } from "@/shared/types/listParams";

export const supportTicketsKeys = {
  all: ["support", "tickets"] as const,
  list: (filters?: ListParams) =>
    [...supportTicketsKeys.all, "list", filters] as const,
};

export function useSupportTicketsList(params?: ListParams) {
  return useQuery({
    queryKey: supportTicketsKeys.list(params),
    queryFn: () => supportTicketsService.list(params),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });
}
