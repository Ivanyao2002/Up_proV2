"use client";

import { useQuery } from "@tanstack/react-query";
import { kycKeys } from "./kyc.keys";
import { kycService } from "./kyc.service";

export function useKycQueue() {
  return useQuery({
    queryKey: kycKeys.queue(),
    queryFn: () => kycService.getQueue(),
  });
}
