import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiFinanceListResponse } from "./adminFinance.api.types";
import { mapFinanceListResponse } from "./adminFinance.mapper";

export type BonusRuleScope = "driver" | "partner" | "franchise" | "platform";
export type BonusRuleStatus = "active" | "draft" | "archived";

export interface BonusRule {
  id: string;
  name: string;
  scope: BonusRuleScope;
  metric: string;
  threshold_value: number;
  reward_xof: number;
  status: BonusRuleStatus;
  valid_from?: string;
  valid_to?: string;
}

interface ApiBonusRuleItem {
  id: string;
  name?: string;
  scope?: string;
  metric?: string;
  threshold_value?: number;
  thresholdValue?: number;
  reward_xof?: number;
  rewardXof?: number;
  status?: string;
  valid_from?: string;
  valid_to?: string;
}

const SCOPE_LABELS: Record<BonusRuleScope, string> = {
  driver: "Chauffeur",
  partner: "Partenaire",
  franchise: "Franchise",
  platform: "Plateforme",
};

export function bonusRuleScopeLabel(scope: BonusRuleScope): string {
  return SCOPE_LABELS[scope] ?? scope;
}

function mapBonusRuleItem(item: ApiBonusRuleItem): BonusRule {
  const scope = String(item.scope ?? "driver").toLowerCase() as BonusRuleScope;
  const status = String(item.status ?? "draft").toLowerCase() as BonusRuleStatus;
  return {
    id: item.id,
    name: item.name?.trim() || "Règle sans nom",
    scope: ["driver", "partner", "franchise", "platform"].includes(scope)
      ? scope
      : "driver",
    metric: item.metric?.trim() || "trips_completed",
    threshold_value: item.threshold_value ?? item.thresholdValue ?? 0,
    reward_xof: item.reward_xof ?? item.rewardXof ?? 0,
    status: ["active", "draft", "archived"].includes(status) ? status : "draft",
    valid_from: item.valid_from,
    valid_to: item.valid_to,
  };
}

export const bonusRulesService = {
  list: async (params?: ListParams): Promise<Paginated<BonusRule>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<BonusRule>>(
        `/admin/finance/bonus-rules${buildListQuery(params)}`
      );
    }

    try {
      const response = await apiClient.get<ApiFinanceListResponse<ApiBonusRuleItem>>(
        `${LINKS.admin.v1.bonusRules}${buildV1ListQuery(params)}`
      );
      return mapFinanceListResponse(response, params, mapBonusRuleItem);
    } catch {
      return {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
      };
    }
  },
};
