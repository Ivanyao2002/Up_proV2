import { apiClient } from "@/core/http/apiClient";
import { notificationService } from "@/core/http/notificationService";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiBonusRuleMutationResponse,
  ApiBonusRuleUpsertBody,
  ApiBonusRulesListResponse,
} from "./bonusRules.api.types";
import { mapApiBonusRuleItem, mapBonusRulesListResponse } from "./bonusRules.mapper";
import type { BonusRule } from "./bonusRules.types";

export type {
  BonusRule,
  BonusRuleScope,
  BonusRuleStatus,
  BonusRuleTier,
} from "./bonusRules.types";

export {
  bonusRuleScopeLabel,
  bonusRulePeriodLabel,
  bonusRulePayoutLabel,
} from "./bonusRules.mapper";

export const bonusRulesService = {
  list: async (params?: ListParams): Promise<Paginated<BonusRule>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<BonusRule>>(
        `/admin/finance/bonus-rules${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiBonusRulesListResponse>(
      `${LINKS.admin.v1.bonusRules}${buildV1ListQuery(params)}`
    );
    return mapBonusRulesListResponse(response, params);
  },

  listAll: async (): Promise<BonusRule[]> => {
    const result = await bonusRulesService.list({ page: 1, per_page: 200 });
    return result.data;
  },

  create: async (body: ApiBonusRuleUpsertBody): Promise<BonusRule> => {
    const response = await apiClient.post<ApiBonusRuleMutationResponse>(
      LINKS.admin.v1.bonusRules,
      body
    );
    const raw = response.rule;
    if (!raw) throw new Error("BONUS_RULE_CREATE_FAILED");
    return mapApiBonusRuleItem(raw);
  },

  update: async (
    id: string,
    body: ApiBonusRuleUpsertBody
  ): Promise<BonusRule> => {
    const response = await apiClient.patch<ApiBonusRuleMutationResponse>(
      LINKS.admin.v1.bonusRuleById(id),
      body
    );
    const raw = response.rule;
    if (!raw) throw new Error("BONUS_RULE_UPDATE_FAILED");
    return mapApiBonusRuleItem(raw);
  },

  saveWithNotify: async (
    id: string | null,
    body: ApiBonusRuleUpsertBody
  ): Promise<BonusRule> => {
    const response = id
      ? await apiClient.patch<ApiBonusRuleMutationResponse>(
          LINKS.admin.v1.bonusRuleById(id),
          body
        )
      : await apiClient.post<ApiBonusRuleMutationResponse>(
          LINKS.admin.v1.bonusRules,
          body
        );

    notificationService.success(
      id ? "Règle bonus enregistrée" : "Règle bonus créée"
    );

    const raw = response.rule;
    if (!raw) throw new Error("BONUS_RULE_SAVE_FAILED");
    return mapApiBonusRuleItem(raw);
  },
};
