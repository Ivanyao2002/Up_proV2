import { apiClient } from "@/core/http/apiClient";

export interface FranchiseDashboard {
  territory_name: string;
  partners_count: number;
  drivers_total: number;
  drivers_online: number;
  trips_today: number;
  trips_completed_today: number;
  revenue_today_fcfa: number;
  revenue_trend_pct: number;
  pending_kyc: number;
  pending_withdrawals_fcfa: number;
  chart_flux: { day: string; revenue: number; trips: number }[];
  recent_partners: {
    id: number;
    name: string;
    drivers_count: number;
    status: "active" | "pending" | "suspended";
  }[];
}

export const franchiseDashboardService = {
  get: () => apiClient.get<FranchiseDashboard>("/franchise/dashboard"),
};
