import type { Driver, PartnerDetail, PartnerWallet, TripStatus } from "@/shared/types";
import type { ApiLiveMapOrderBase } from "@/features/ops/api/liveMap.api.types";
import { mapApiOrderStatus, orderRef } from "@/features/admin/api/adminOrder.shared";
import type { ApiV1PartnerDriverItem } from "./adminPartnerDrivers.api.types";
import type { ApiV1PartnerDetailResponse } from "./adminPartnerDetail.api.types";
import type { PartnerLookupMaps } from "./adminPartners.mapper";
import { mapAdminPartnerItemToPartner } from "./adminPartners.mapper";
import type { ApiAdminPartnerItem } from "./adminPartners.api.types";
import type { ApiV1PartnerLedgerItem } from "./adminPartnerWallet.api.types";
import {
  mapApiPartnerWalletToUi,
  mapEmbeddedPartnerWalletToUi,
} from "./adminPartnerWallet.mapper";

function mapPartnerStatus(status?: string | null): PartnerDetail["status"] {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "active") return "active";
  if (key === "suspended") return "suspended";
  return "pending";
}

function mapDriverAvailability(
  status?: string | null
): Driver["availability"] {
  const key = String(status ?? "offline").toLowerCase();
  if (key === "online") return "online";
  if (key === "on_trip" || key === "on-trip" || key === "busy") return "on_trip";
  if (key === "paused") return "paused";
  return "offline";
}

function partnerDriverLabel(driver: ApiV1PartnerDriverItem): string {
  const profile = driver.profile;
  const display =
    profile?.displayName?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (display) return display;
  if (driver.driver_code?.trim()) return driver.driver_code.trim();
  const zone = driver.metadata?.zoneLabel;
  if (zone) return `Chauffeur · ${zone}`;
  return `Chauffeur ${driver.id.slice(0, 8)}`;
}

export function mapApiPartnerDriverToDetailRow(
  driver: ApiV1PartnerDriverItem
): PartnerDetail["drivers"][0] {
  return {
    id: driver.id,
    name: partnerDriverLabel(driver),
    availability: mapDriverAvailability(driver.availability_status),
    rating: driver.rating_avg ?? 0,
  };
}

export function mapApiPartnerOrderToRecentTrip(
  order: ApiLiveMapOrderBase
): PartnerDetail["recent_trips"][0] {
  const amount =
    order.final_price_xof ??
    order.estimated_price_xof ??
    (order as { amountXof?: number }).amountXof ??
    0;

  return {
    id: order.id,
    ref: orderRef(order),
    amount_fcfa: amount,
    status: mapApiOrderStatus(order.status) as TripStatus,
    created_at: order.created_at ?? new Date().toISOString(),
  };
}

export function buildPartnerDetailStats(
  drivers: PartnerDetail["drivers"],
  trips: PartnerDetail["recent_trips"],
  wallet?: PartnerWallet,
  fallbackBalance?: number | null
): PartnerDetail["stats"] {
  const driversOnline = drivers.filter(
    (d) => d.availability === "online" || d.availability === "on_trip"
  ).length;
  const revenue = trips.reduce((sum, t) => sum + (t.amount_fcfa ?? 0), 0);

  return {
    drivers_count: drivers.length,
    drivers_online: driversOnline,
    trips_month: trips.length,
    revenue_month_fcfa: revenue,
    wallet_balance_fcfa: wallet?.balance_fcfa ?? fallbackBalance ?? 0,
    pending_withdrawal_fcfa: wallet?.pending_withdrawal_fcfa ?? 0,
  };
}

function resolvePartnerWallet(
  partner: ApiV1PartnerDetailResponse["partner"],
  options?: {
    wallet?: Parameters<typeof mapApiPartnerWalletToUi>[0];
    ledger?: ApiV1PartnerLedgerItem[];
  }
): PartnerWallet | undefined {
  const embedded = mapEmbeddedPartnerWalletToUi(
    partner.wallet as Record<string, unknown> | null | undefined,
    options?.ledger
  );
  if (embedded) return embedded;

  const fromRoute = mapApiPartnerWalletToUi(options?.wallet, options?.ledger);
  if (fromRoute) return fromRoute;

  const balance = partner.stats?.walletBalanceXof;
  if (balance != null) {
    return {
      balance_fcfa: balance,
      pending_withdrawal_fcfa: 0,
      available_fcfa: balance,
      recent_movements: (options?.ledger ?? []).map((item) => ({
        id: item.id,
        label: item.description?.trim() || item.entry_type || "Mouvement",
        amount_fcfa: item.amount_xof ?? 0,
        direction:
          String(item.direction ?? "credit").toLowerCase() === "debit"
            ? "debit"
            : "credit",
        created_at:
          item.posted_at ?? item.created_at ?? new Date().toISOString(),
      })),
    };
  }

  return undefined;
}

export function mapV1PartnerDetailToPartnerDetail(
  response: ApiV1PartnerDetailResponse,
  lookups?: PartnerLookupMaps,
  options?: {
    drivers?: ApiV1PartnerDriverItem[];
    orders?: ApiLiveMapOrderBase[];
    wallet?: Parameters<typeof mapApiPartnerWalletToUi>[0];
    ledger?: ApiV1PartnerLedgerItem[];
  }
): PartnerDetail {
  const p = response.partner;
  const listShape: ApiAdminPartnerItem = {
    id: p.id,
    franchise_id: p.franchise_id,
    legal_name: p.legal_name,
    trade_name: p.trade_name,
    name: p.name ?? p.trade_name ?? p.legal_name,
    partner_type: p.partner_type,
    legal_form: p.legal_form,
    manager_first_name: p.manager_first_name,
    manager_last_name: p.manager_last_name,
    manager_display_name: p.manager_display_name,
    commission_rate: p.commission_rate,
    city_id: p.city_id,
    contact_phone: p.contact_phone,
    contact_email: p.contact_email,
    status: p.status,
    driversCount: p.stats?.driversCount ?? options?.drivers?.length ?? 0,
  };
  const base = mapAdminPartnerItemToPartner(listShape, lookups);

  const drivers = (options?.drivers ?? []).map(mapApiPartnerDriverToDetailRow);
  const recent_trips = (options?.orders ?? []).map(mapApiPartnerOrderToRecentTrip);
  const wallet = resolvePartnerWallet(p, {
    wallet: options?.wallet,
    ledger: options?.ledger,
  });

  return {
    ...base,
    city_id: p.city_id ?? undefined,
    address: p.address?.trim() || "—",
    created_at: p.created_at ?? new Date().toISOString(),
    wallet_id: p.wallet_id ?? options?.wallet?.id ?? null,
    wallet,
    stats: buildPartnerDetailStats(
      drivers,
      recent_trips,
      wallet,
      p.stats?.walletBalanceXof
    ),
    drivers,
    recent_trips,
    status: mapPartnerStatus(p.status),
  };
}
