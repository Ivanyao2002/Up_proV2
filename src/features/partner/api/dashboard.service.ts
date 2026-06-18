import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { DashboardPartnerKpi, TripStatus } from "@/shared/types";

interface PartnerDashboardApiResponse {
  status: string;
  generatedAt?: string;
  dashboard: {
    fleetName?: string;
    driversCount?: number;
    driversOnline?: number;
    driversPendingKyc?: number;
    vehiclesCount?: number;
    tripsToday?: number;
    tripsCompletedToday?: number;
    tripsCancelledToday?: number;
    revenueToday?: number;
    revenueTrendPct?: number;
    walletBalance?: number;
    pendingWithdrawal?: number;
    chartFlux?: { day: string; revenue: number; trips: number }[];
    recentTrips?: ApiRecentTrip[];
  };
}

interface ApiRecentTrip {
  id: string;
  ref?: string;
  status?: string;
  amount?: number;
  amount_fcfa?: number;
  created_at?: string;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  from_label?: string | null;
  to_label?: string | null;
  driver_name?: string | null;
}

function mapRecentTrip(raw: ApiRecentTrip): DashboardPartnerKpi["recent_trips"][0] {
  return {
    id: String(raw.id),
    ref: raw.ref?.trim() || "—",
    from_label:
      raw.from_label?.trim() ||
      raw.pickup_address?.trim() ||
      "—",
    to_label:
      raw.to_label?.trim() ||
      raw.dropoff_address?.trim() ||
      "—",
    driver_name: raw.driver_name?.trim() || undefined,
    amount_fcfa: raw.amount_fcfa ?? raw.amount ?? 0,
    status: (raw.status ?? "pending") as TripStatus,
    created_at: raw.created_at ?? "",
  };
}

function mapApiResponse(raw: PartnerDashboardApiResponse): DashboardPartnerKpi {
  const d = raw.dashboard ?? {};
  return {
    fleet_name: d.fleetName ?? "Ma flotte",
    trips_today: d.tripsToday ?? 0,
    trips_completed_today: d.tripsCompletedToday ?? 0,
    trips_cancelled_today: d.tripsCancelledToday ?? 0,
    drivers_total: d.driversCount ?? 0,
    drivers_online: d.driversOnline ?? 0,
    drivers_pending_kyc: d.driversPendingKyc ?? 0,
    vehicles_total: d.vehiclesCount ?? 0,
    revenue_today_fcfa: d.revenueToday ?? 0,
    revenue_trend_pct: d.revenueTrendPct ?? 0,
    wallet_balance_fcfa: d.walletBalance ?? 0,
    pending_withdrawal_fcfa: d.pendingWithdrawal ?? 0,
    chart_flux: d.chartFlux ?? [],
    recent_trips: (d.recentTrips ?? []).map(mapRecentTrip),
  };
}

export const partnerDashboardService = {
  get: async (partnerId: string | number): Promise<DashboardPartnerKpi> => {
    const raw = await apiClient.get<PartnerDashboardApiResponse>(
      LINKS.partner.dashboard(partnerId)
    );
    return mapApiResponse(raw);
  },
};
