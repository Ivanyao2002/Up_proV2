import type { ComptaDashboardData, ComptaMeResponse } from "./comptaPortal.types";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function readXof(...values: unknown[]): number {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function mapComptaMe(payload: unknown): ComptaMeResponse {
  const root = asRecord(payload);
  if (!root) return {};
  return root as ComptaMeResponse;
}

export function mapComptaDashboard(payload: unknown): ComptaDashboardData {
  const root = asRecord(payload);
  if (!root) {
    return {
      credits_today_fcfa: 0,
      debits_today_fcfa: 0,
      commissions_month_fcfa: 0,
      withdrawals_pending_count: 0,
      withdrawals_pending_fcfa: 0,
      reconciliation_open_gaps: 0,
      reversals_this_month: 0,
    };
  }

  const entriesToday = asRecord(root.entries_today) ?? asRecord(root.entriesToday);
  const commissions = asRecord(root.commissions);
  const reconciliation = asRecord(root.reconciliation);
  const period = asRecord(root.period);
  const country = asRecord(root.country) ?? asRecord(period?.country);

  return {
    credits_today_fcfa: readXof(
      entriesToday?.credit_xof,
      entriesToday?.credits_xof,
      entriesToday?.credit_fcfa
    ),
    debits_today_fcfa: readXof(
      entriesToday?.debit_xof,
      entriesToday?.debits_xof,
      entriesToday?.debit_fcfa
    ),
    commissions_month_fcfa: readXof(
      commissions?.debited,
      commissions?.debited_xof,
      commissions?.month_xof
    ),
    withdrawals_pending_count: readXof(root.withdrawals_pending_count),
    withdrawals_pending_fcfa: readXof(root.withdrawals_pending_fcfa, root.withdrawals_pending_xof),
    reconciliation_open_gaps: readXof(
      reconciliation?.open_gaps,
      reconciliation?.unjustified_gaps
    ),
    reversals_this_month: readXof(root.reversals_this_month),
    period_label: typeof period?.label === "string" ? period.label : undefined,
    period_status: typeof period?.status === "string" ? period.status : undefined,
    country_name: typeof country?.name === "string" ? country.name : undefined,
  };
}
