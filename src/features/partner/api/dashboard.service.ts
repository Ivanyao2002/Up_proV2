import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { DashboardPartnerKpi, TripStatus } from "@/shared/types";

interface PartnerDashboardApiResponse {
  status: string;
  generatedAt?: string;
  dashboard?: Record<string, unknown>;
}

function readString(
  source: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function readNumber(
  source: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
  }
  return undefined;
}

function mapRecentTrip(raw: Record<string, unknown>): DashboardPartnerKpi["recent_trips"][0] {
  return {
    id: String(raw.id ?? ""),
    ref:
      readString(raw, "ref", "orderReference", "order_reference") ?? "—",
    from_label:
      readString(
        raw,
        "from_label",
        "fromLabel",
        "pickup_address",
        "pickupAddress"
      ) ?? "—",
    to_label:
      readString(
        raw,
        "to_label",
        "toLabel",
        "dropoff_address",
        "dropoffAddress"
      ) ?? "—",
    driver_name: readString(raw, "driver_name", "driverName"),
    amount_fcfa:
      readNumber(raw, "amount_fcfa", "amountFcfa", "amount", "amountXof", "amount_xof") ?? 0,
    status: (readString(raw, "status") ?? "pending") as TripStatus,
    created_at:
      readString(raw, "created_at", "createdAt") ?? "",
  };
}

function mapApiResponse(raw: PartnerDashboardApiResponse): DashboardPartnerKpi {
  const d = raw.dashboard ?? {};
  const recentRaw =
    (Array.isArray(d.recentTrips) ? d.recentTrips : null) ??
    (Array.isArray(d.recent_trips) ? d.recent_trips : null) ??
    [];

  return {
    fleet_name: readString(d, "fleetName", "fleet_name") ?? "Ma flotte",
    trips_today: readNumber(d, "tripsToday", "trips_today") ?? 0,
    trips_completed_today:
      readNumber(d, "tripsCompletedToday", "trips_completed_today") ?? 0,
    trips_cancelled_today:
      readNumber(d, "tripsCancelledToday", "trips_cancelled_today") ?? 0,
    drivers_total: readNumber(d, "driversCount", "drivers_count") ?? 0,
    drivers_online: readNumber(d, "driversOnline", "drivers_online") ?? 0,
    drivers_pending_kyc:
      readNumber(d, "driversPendingKyc", "drivers_pending_kyc") ?? 0,
    vehicles_total: readNumber(d, "vehiclesCount", "vehicles_count") ?? 0,
    revenue_today_fcfa:
      readNumber(d, "revenueToday", "revenue_today", "revenueTodayFcfa") ?? 0,
    revenue_trend_pct:
      readNumber(d, "revenueTrendPct", "revenue_trend_pct") ?? 0,
    wallet_balance_fcfa:
      readNumber(d, "walletBalance", "wallet_balance") ?? 0,
    pending_withdrawal_fcfa:
      readNumber(d, "pendingWithdrawal", "pending_withdrawal") ?? 0,
    chart_flux:
      (Array.isArray(d.chartFlux) ? d.chartFlux : null) ??
      (Array.isArray(d.chart_flux) ? d.chart_flux : null) ??
      [],
    recent_trips: recentRaw.map((trip) =>
      mapRecentTrip(trip as Record<string, unknown>)
    ),
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
