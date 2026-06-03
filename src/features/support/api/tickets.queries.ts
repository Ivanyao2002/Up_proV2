"use client";

import { useQuery } from "@tanstack/react-query";
import { supportTicketsService } from "./tickets.service";

export function useSupportTicketsList() {
  return useQuery({
    queryKey: ["support", "tickets"],
    queryFn: () => supportTicketsService.list(),
  });
}
