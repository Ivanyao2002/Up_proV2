"use client";

import { useQuery } from "@tanstack/react-query";
import { partnersKeys } from "./partners.keys";
import { partnerDetailService } from "./partnerDetail.service";

export function usePartnerDetail(id: string) {
  return useQuery({
    queryKey: [...partnersKeys.all, "detail", id],
    queryFn: () => partnerDetailService.getById(id),
    enabled: Boolean(id),
  });
}
