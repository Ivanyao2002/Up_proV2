import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type {
  ApiBonusAwardItem,
  ApiBonusAwardsListResponse,
  ApiBonusRunEvaluationResponse,
} from "./bonusAwards.api.types";
import type {
  BonusAward,
  BonusAwardStatus,
  BonusRunEvaluationResult,
} from "./bonusAwards.types";

export const BONUS_AWARD_STATUS_LABELS: Record<BonusAwardStatus, string> = {
  eligible: "Éligible",
  ineligible: "Non éligible",
  paid: "Payé",
  pending: "En attente",
};

function firstNumber(...values: Array<number | null | undefined>): number | null {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function firstString(...values: Array<string | null | undefined>): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function mapStatus(item: ApiBonusAwardItem, eligible: boolean): BonusAwardStatus {
  const raw = String(item.status ?? "").toLowerCase();
  if (raw === "paid" || raw === "credited") return "paid";
  if (raw === "pending" || raw === "queued") return "pending";
  if (raw === "ineligible" || raw === "not_eligible") return "ineligible";
  if (raw === "eligible") return "eligible";
  return eligible ? "eligible" : "ineligible";
}

function readEligible(item: ApiBonusAwardItem): boolean {
  if (typeof item.eligible === "boolean") return item.eligible;
  if (typeof item.is_eligible === "boolean") return item.is_eligible;
  const raw = String(item.status ?? "").toLowerCase();
  if (raw === "ineligible" || raw === "not_eligible") return false;
  if (raw === "eligible" || raw === "paid" || raw === "credited") return true;
  // À défaut : un montant strictement positif vaut éligibilité.
  return (firstNumber(item.amount_xof, item.amountXof, item.amount, item.reward_xof) ?? 0) > 0;
}

function readPeriodLabel(item: ApiBonusAwardItem): string {
  const label = firstString(item.period_label, item.periodLabel, item.period);
  if (label) return label;
  const start = firstString(item.period_start, item.periodStart);
  const end = firstString(item.period_end, item.periodEnd);
  if (start && end) return `${start} → ${end}`;
  return start ?? "—";
}

export function mapApiBonusAwardItem(item: ApiBonusAwardItem): BonusAward {
  const eligible = readEligible(item);
  return {
    id: item.id,
    driverId: firstString(item.driver_id, item.driverId),
    driverName: firstString(item.driver_name, item.driverName) ?? "Chauffeur inconnu",
    driverPhone: firstString(item.driver_phone, item.driverPhone),
    amountXof:
      firstNumber(item.amount_xof, item.amountXof, item.amount, item.reward_xof) ?? 0,
    periodLabel: readPeriodLabel(item),
    periodStart: firstString(item.period_start, item.periodStart),
    periodEnd: firstString(item.period_end, item.periodEnd),
    ruleId: firstString(item.rule_id, item.ruleId),
    ruleName: firstString(item.rule_name, item.ruleName) ?? "—",
    eligible,
    status: mapStatus(item, eligible),
    reason: firstString(item.reason),
    metricValue: firstNumber(item.metric_value, item.metricValue),
    thresholdValue: firstNumber(item.threshold_value, item.thresholdValue),
    awardedAt: firstString(
      item.awarded_at,
      item.awardedAt,
      item.created_at,
      item.createdAt
    ),
  };
}

export function bonusAwardStatusLabel(status: BonusAwardStatus): string {
  return BONUS_AWARD_STATUS_LABELS[status] ?? status;
}

export function mapBonusAwardsListResponse(
  response: ApiBonusAwardsListResponse,
  params?: ListParams
): Paginated<BonusAward> {
  const source = response.awards ?? response.items ?? response.data ?? [];
  const mapped = source.map(mapApiBonusAwardItem);

  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }

  return paginateClientList(mapped, params);
}

export function mapBonusRunEvaluationResponse(
  response: ApiBonusRunEvaluationResponse
): BonusRunEvaluationResult {
  const summary = response.summary ?? {};
  return {
    evaluated: summary.evaluated ?? 0,
    awarded: summary.awarded ?? 0,
    skipped: summary.skipped ?? 0,
    totalAmountXof: summary.total_amount_xof ?? summary.totalAmountXof ?? 0,
    message: response.message?.trim() || "Évaluation des bonus terminée",
  };
}
