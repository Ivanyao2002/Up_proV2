import { apiClient } from "@/core/http/apiClient";

export interface FranchiseFinance {
  balance_fcfa: number;
  commission_month_fcfa: number;
  payouts_pending_fcfa: number;
  transactions: {
    id: string;
    label: string;
    amount_fcfa: number;
    direction: "credit" | "debit";
    created_at: string;
  }[];
}

export const franchiseFinanceService = {
  get: () => apiClient.get<FranchiseFinance>("/franchise/finance"),
};
