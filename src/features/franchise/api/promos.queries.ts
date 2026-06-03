"use client";

import { useQuery } from "@tanstack/react-query";
import {
  franchisePromosService,
  franchiseSupportService,
} from "./promos.service";

export function useFranchisePromos() {
  return useQuery({
    queryKey: ["franchise", "promos"],
    queryFn: () => franchisePromosService.list(),
  });
}

export function useFranchiseSupportTickets() {
  return useQuery({
    queryKey: ["franchise", "support"],
    queryFn: () => franchiseSupportService.list(),
  });
}
