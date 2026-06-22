import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type {
  ApiBonusRuleItem,
  ApiBonusRuleTier,
  ApiBonusRulesListResponse,
} from "./bonusRules.api.types";
import type {
  BonusRule,
  BonusRuleScope,
  BonusRuleStatus,
  BonusRuleTier,
} from "./bonusRules.types";

const SCOPE_MAP: Record<string, BonusRuleScope> = {
  global: "platform",
  platform: "platform",
  driver: "driver",
  partner: "partner",
  franchise: "franchise",
};

export const BONUS_RULE_SCOPE_LABELS: Record<BonusRuleScope, string> = {
  driver: "Chauffeur",
  partner: "Partenaire",
  franchise: "Franchise",
  platform: "Globale",
};

export const BONUS_RULE_PERIOD_LABELS: Record<string, string> = {
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuelle",
  DAILY: "Quotidienne",
};

export const BONUS_RULE_PAYOUT_LABELS: Record<string, string> = {
  HIGHEST_TIER: "Palier le plus élevé",
  CUMULATIVE: "Cumul des paliers",
  FIRST_TIER: "Premier palier atteint",
};

function mapScope(raw?: string | null): BonusRuleScope {
  const key = String(raw ?? "driver").toLowerCase();
  return SCOPE_MAP[key] ?? "driver";
}

function mapStatus(item: ApiBonusRuleItem): BonusRuleStatus {
  const statusKey = String(item.status ?? "").toLowerCase();
  if (statusKey === "archived") return "archived";
  if (statusKey === "draft") return "draft";
  if (item.active === false) return "draft";
  if (item.active === true || statusKey === "active") return "active";
  return "draft";
}

function mapTier(tier: ApiBonusRuleTier): BonusRuleTier {
  return {
    minTrips: tier.min_trips ?? tier.minTrips ?? 0,
    rewardXof: tier.reward_xof ?? tier.rewardXof ?? 0,
  };
}

function readRuleName(item: ApiBonusRuleItem): string {
  return (
    item.metadata?.label?.trim() ||
    item.name?.trim() ||
    "Règle sans nom"
  );
}

function readTiers(item: ApiBonusRuleItem): BonusRuleTier[] {
  if (item.tiers?.length) {
    return item.tiers.map(mapTier).sort((a, b) => a.minTrips - b.minTrips);
  }

  const threshold = item.threshold_value ?? item.thresholdValue;
  const reward = item.reward_xof ?? item.rewardXof;
  if (threshold != null || reward != null) {
    return [
      {
        minTrips: threshold ?? 0,
        rewardXof: reward ?? 0,
      },
    ];
  }

  return [];
}

export function mapApiBonusRuleItem(item: ApiBonusRuleItem): BonusRule {
  const tiers = readTiers(item);
  const topTier = tiers.at(-1);

  return {
    id: item.id,
    name: readRuleName(item),
    rawScope: String(item.scope ?? "GLOBAL").toUpperCase(),
    scope: mapScope(item.scope),
    period: item.period ?? "WEEKLY",
    payoutModel: item.payout_model ?? item.payoutModel ?? "HIGHEST_TIER",
    metric: item.metric?.trim() || "trips_completed",
    tiers,
    thresholdValue: topTier?.minTrips ?? 0,
    rewardXof: topTier?.rewardXof ?? 0,
    status: mapStatus(item),
    countedServiceTypes:
      item.counted_service_types ?? item.countedServiceTypes ?? [],
    fundedBy: item.funded_by ?? item.fundedBy,
    priority: item.priority,
    effectiveFrom: item.effective_from ?? item.effectiveFrom ?? item.valid_from,
    effectiveTo: item.effective_to ?? item.effectiveTo ?? item.valid_to,
    franchiseId: item.franchise_id ?? item.franchiseId ?? null,
    partnerId: item.partner_id ?? item.partnerId ?? null,
  };
}

export function bonusRuleScopeLabel(scope: BonusRuleScope): string {
  return BONUS_RULE_SCOPE_LABELS[scope] ?? scope;
}

export function bonusRulePeriodLabel(period?: string | null): string {
  if (!period) return "—";
  return BONUS_RULE_PERIOD_LABELS[period] ?? period;
}

export function bonusRulePayoutLabel(model?: string | null): string {
  if (!model) return "—";
  return BONUS_RULE_PAYOUT_LABELS[model] ?? model;
}

export function mapBonusRulesListResponse(
  response: ApiBonusRulesListResponse,
  params?: ListParams
): Paginated<BonusRule> {
  const source = response.rules ?? response.items ?? [];
  const mapped = source.map(mapApiBonusRuleItem);

  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }

  return paginateClientList(mapped, params);
}
