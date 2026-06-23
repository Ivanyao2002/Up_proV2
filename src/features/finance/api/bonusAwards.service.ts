import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiBonusAwardsListResponse,
  ApiBonusRunEvaluationResponse,
} from "./bonusAwards.api.types";
import {
  mapBonusAwardsListResponse,
  mapBonusRunEvaluationResponse,
} from "./bonusAwards.mapper";
import type { BonusAward, BonusRunEvaluationResult } from "./bonusAwards.types";

export type {
  BonusAward,
  BonusAwardStatus,
  BonusRunEvaluationResult,
} from "./bonusAwards.types";

export { bonusAwardStatusLabel } from "./bonusAwards.mapper";

export const bonusAwardsService = {
  /** Historique des crédits bonus — GET /v1/admin/bonus-awards */
  list: async (params?: ListParams): Promise<Paginated<BonusAward>> => {
    if (useLegacyAdminApi()) {
      const response = await apiClient.get<ApiBonusAwardsListResponse>(
        `/admin/finance/bonus-awards${buildListQuery(params)}`
      );
      return mapBonusAwardsListResponse(response, params);
    }

    const response = await apiClient.get<ApiBonusAwardsListResponse>(
      `${LINKS.admin.v1.bonusAwards}${buildV1ListQuery(params)}`
    );
    return mapBonusAwardsListResponse(response, params);
  },

  /** Déclenche le moteur d'évaluation des bonus — POST /v1/admin/bonus/run-evaluation */
  runEvaluation: async (): Promise<BonusRunEvaluationResult> => {
    if (useLegacyAdminApi()) {
      const response = await apiClient.post<ApiBonusRunEvaluationResponse>(
        "/admin/finance/bonus/run-evaluation"
      );
      return mapBonusRunEvaluationResponse(response);
    }

    const response = await apiClient.post<ApiBonusRunEvaluationResponse>(
      LINKS.admin.v1.bonusRunEvaluation
    );
    return mapBonusRunEvaluationResponse(response);
  },
};
