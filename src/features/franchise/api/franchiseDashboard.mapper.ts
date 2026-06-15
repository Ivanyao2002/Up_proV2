import type { ApiV1FranchisePartnersResponse } from "@/features/network/api/adminFranchises.api.types";
import type { FranchiseDashboard } from "./dashboard.service";

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asPartnerStatus(
  value: unknown
): FranchiseDashboard["recent_partners"][number]["status"] {
  if (value === "active" || value === "pending" || value === "suspended") return value;
  return "pending";
}

/**
 * Mappe la réponse de GET /v1/franchise/dashboard
 * { status, dashboard: { franchiseId, partners, drivers, rides, deliveries } }
 * combinée avec GET /v1/franchise/partners (items[])
 */
export function mapFranchiseDashboard(
  dashPayload: unknown,
  partnersPayload: ApiV1FranchisePartnersResponse
): FranchiseDashboard {
  const root = (dashPayload ?? {}) as Record<string, unknown>;
  const d = (root.dashboard ?? root) as Record<string, unknown>;

  const partners_count = asNumber(d.partners ?? partnersPayload.pagination?.total);
  const drivers_total = asNumber(d.drivers);
  const trips_today = asNumber((d.rides as number ?? 0) + (d.deliveries as number ?? 0));

  const partnerItems = partnersPayload.items ?? [];
  const recent_partners: FranchiseDashboard["recent_partners"] = partnerItems
    .slice(0, 5)
    .map((p) => ({
      id: String(p.id),
      name: p.trade_name?.trim() || p.legal_name?.trim() || `Partenaire ${String(p.id).slice(0, 8)}`,
      drivers_count: asNumber(p.driversCount),
      status: asPartnerStatus(p.status),
    }));

  // Map pending_withdrawals from API response
  const pw = (d.pending_withdrawals ?? {}) as Record<string, unknown>;
  const pending_withdrawals = {
    total_fcfa: asNumber(pw.total_xof ?? pw.total_fcfa),
    partners_fcfa: asNumber(pw.partners_xof ?? pw.partners_fcfa),
    partners_requests_count: asNumber(pw.partners_requests_count),
    drivers_fcfa: asNumber(pw.drivers_xof ?? pw.drivers_fcfa),
    drivers_requests_count: asNumber(pw.drivers_requests_count),
  };

  // Map weekly_flow to chart_flux from API response
  // Reorder to start from Monday
  const dayOrder: Record<string, number> = { Lun: 0, Mar: 1, Mer: 2, Jeu: 3, Ven: 4, Sam: 5, Dim: 6 };
  const wf = (d.weekly_flow ?? {}) as Record<string, unknown>;
  const labels = (wf.labels ?? []) as unknown[];
  const revenue = (wf.revenue ?? []) as unknown[];
  const trips = (wf.trips ?? []) as unknown[];
  
  const rawData = labels.map((label, i) => ({
    day: String(label),
    revenue: asNumber(revenue[i]),
    trips: asNumber(trips[i]),
  }));
  
  // Sort by day order: Lun, Mar, Mer, Jeu, Ven, Sam, Dim
  const chart_flux: FranchiseDashboard["chart_flux"] = rawData.sort((a, b) => {
    return (dayOrder[a.day] ?? 7) - (dayOrder[b.day] ?? 7);
  });

  return {
    territory_name:
      (typeof d.franchiseName === "string" && d.franchiseName.trim()) ||
      (typeof d.territory_name === "string" && d.territory_name.trim()) ||
      "Territoire",
    partners_count,
    drivers_total,
    drivers_online: asNumber(d.drivers_online ?? d.driversOnline),
    trips_today,
    trips_today_trend_pct: asNumber(d.trips_today_trend_pct),
    trips_completed_today: asNumber(d.trips_completed_today),
    revenue_today_fcfa: asNumber(d.revenue_today_fcfa ?? d.revenue_today_xof ?? d.revenueTodayXof),
    revenue_trend_pct: asNumber(d.revenue_trend_pct),
    pending_kyc: asNumber(d.pending_kyc ?? d.pendingKyc),
    pending_withdrawals,
    chart_flux,
    recent_partners,
  };
}
