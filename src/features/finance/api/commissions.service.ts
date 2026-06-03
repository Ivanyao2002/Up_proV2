import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";

export interface CommissionRow {
  id: string;
  period_label: string;
  franchise_name: string;
  trips_count: number;
  gross_fcfa: number;
  commission_fcfa: number;
  rate_pct: number;
  status: "pending" | "paid";
}

export interface ReconciliationRow {
  id: string;
  date_label: string;
  source: string;
  expected_fcfa: number;
  received_fcfa: number;
  delta_fcfa: number;
  status: "matched" | "discrepancy" | "pending";
}

export const commissionsService = {
  list: () =>
    apiClient.get<Paginated<CommissionRow>>("/admin/finance/commissions"),
};

export const reconciliationService = {
  list: () =>
    apiClient.get<Paginated<ReconciliationRow>>("/admin/finance/reconciliation"),
};
