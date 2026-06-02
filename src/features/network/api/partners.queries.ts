"use client";

import { useQuery } from "@tanstack/react-query";
import { partnersKeys } from "./partners.keys";
import { partnersService } from "./partners.service";

export function usePartnersList() {
  return useQuery({
    queryKey: partnersKeys.list(),
    queryFn: () => partnersService.listAdmin(),
  });
}
