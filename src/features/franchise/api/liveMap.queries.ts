import { useQuery } from "@tanstack/react-query";
import { franchiseLiveMapService } from "./liveMap.service";

export const franchiseLiveMapKeys = {
  all: ["franchise", "live-map"] as const,
};

export function useFranchiseLiveMap() {
  return useQuery({
    queryKey: franchiseLiveMapKeys.all,
    queryFn: () => franchiseLiveMapService.get(),
    refetchInterval: 30_000,
  });
}
