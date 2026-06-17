import { LINKS } from "@/core/api/links";
import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import type { AccountingPeriod, AccountingPeriodsResponse } from "./compta.types";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function toPeriod(row: unknown, index: number): AccountingPeriod | null {
  const rec = asRecord(row);
  if (!rec) return null;
  const id = String(rec.id ?? rec.period_id ?? `period-${index}`);
  const periodStart = typeof rec.period_start === "string" ? rec.period_start : undefined;
  const periodEnd = typeof rec.period_end === "string" ? rec.period_end : undefined;
  const label =
    typeof rec.label === "string"
      ? rec.label
      : periodStart && periodEnd
        ? `${periodStart} - ${periodEnd}`
        : periodStart ?? id;

  return {
    id,
    label,
    period_type: typeof rec.period_type === "string" ? rec.period_type : undefined,
    status: typeof rec.status === "string" ? rec.status : "open",
    period_start: periodStart,
    period_end: periodEnd,
    closed_at: typeof rec.closed_at === "string" ? rec.closed_at : undefined,
    locked_at: typeof rec.locked_at === "string" ? rec.locked_at : undefined,
  };
}

function extractPeriods(payload: unknown): AccountingPeriod[] {
  const root = asRecord(payload);
  if (!root) return [];
  const candidates: unknown[] = [
    root.items,
    root.periods,
    root.data,
    asRecord(root.data)?.items,
    asRecord(root.data)?.periods,
  ];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    return candidate
      .map((row, index) => toPeriod(row, index))
      .filter((row): row is AccountingPeriod => row != null);
  }
  return [];
}

export const accountingPeriodsService = {
  async listAdmin(): Promise<AccountingPeriodsResponse> {
    const response = await apiClient.get<unknown>(LINKS.admin.v1.accounting.periods);
    return { data: extractPeriods(response) };
  },

  async closeCurrent(payload?: {
    period_type?: "daily" | "monthly";
    period_end?: string;
    force?: boolean;
    note?: string;
  }) {
    return apiWithNotify.post(
      LINKS.admin.v1.accounting.closePeriod,
      payload ?? {},
      "Période clôturée"
    );
  },
};
