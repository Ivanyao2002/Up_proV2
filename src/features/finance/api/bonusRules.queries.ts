import { useQuery } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { bonusRulesService } from "./bonusRules.service";

export function useBonusRulesList(params?: ListParams) {
  return useQuery({
    queryKey: ["admin", "bonus-rules", params],
    queryFn: () => bonusRulesService.list(params),
  });
}
