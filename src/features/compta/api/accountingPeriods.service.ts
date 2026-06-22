import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { createUrl } from "@/core/api/links";
import type { ComptaApiScope } from "./comptaApiScope";
import { comptaPeriodLinks } from "./comptaApiScope";
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

function portalCloseBody(payload?: {
  period_type?: "daily" | "monthly";
  period_end?: string;
}) {
  const periodEnd = payload?.period_end ?? new Date().toISOString().slice(0, 10);
  const isDaily = payload?.period_type === "daily";
  return {
    period: isDaily ? periodEnd : periodEnd.slice(0, 7),
    periodType: isDaily ? "DAY" : "MONTH",
  };
}

export const accountingPeriodsService = {
  list: async (
    scope: ComptaApiScope,
    periodType?: "DAY" | "MONTH"
  ): Promise<AccountingPeriodsResponse> => {
    const links = comptaPeriodLinks(scope);
    const url =
      scope === "portal" && periodType
        ? createUrl(links.periods, { periodType })
        : links.periods;
    const response = await apiClient.get<unknown>(url);
    return { data: extractPeriods(response) };
  },

  /** @deprecated Préférer `list("admin")` */
  async listAdmin(): Promise<AccountingPeriodsResponse> {
    return accountingPeriodsService.list("admin");
  },

  close: (
    scope: ComptaApiScope,
    payload?: {
      period_type?: "daily" | "monthly";
      period_end?: string;
      force?: boolean;
      note?: string;
    }
  ) => {
    const links = comptaPeriodLinks(scope);
    const body = scope === "portal" ? portalCloseBody(payload) : (payload ?? {});
    return apiWithNotify.post(links.closePeriod, body, "Période clôturée");
  },

  /** @deprecated Préférer `close("admin", payload)` */
  async closeCurrent(payload?: {
    period_type?: "daily" | "monthly";
    period_end?: string;
    force?: boolean;
    note?: string;
  }) {
    return accountingPeriodsService.close("admin", payload);
  },
};
