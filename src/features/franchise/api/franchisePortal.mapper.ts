import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiAdminDriverItem } from "@/features/fleet/api/adminDrivers.api.types";
import { mapAdminDriverItemToListDriver } from "@/features/fleet/api/adminDrivers.mapper";
import {
  mapApiOrderStatus,
  mapApiPaymentMethod,
  mapApiServiceType,
  orderRef,
} from "@/features/admin/api/adminOrder.shared";
import { liveMapOrderStatusLabel } from "@/features/ops/api/liveMap.labels";
import { mapEventsToTimeline, mapDispatchOffers } from "@/features/ops/api/adminOrderDetail.mapper";
import type { ApiAdminOrderDispatchOffer } from "@/features/ops/api/adminOrderDetail.api.types";
export type { ApiAdminOrderDetailResponse as ApiFranchiseOrderDetailResponse } from "@/features/ops/api/adminOrderDetail.api.types";
import type { ApiAdminOrderDetailResponse } from "@/features/ops/api/adminOrderDetail.api.types";
import type { ApiLiveMapOrderBase } from "@/features/ops/api/liveMap.api.types";
import type { ApiV1FranchisePartnersResponse } from "@/features/network/api/adminFranchises.api.types";
import type { Driver, Paginated, Trip, TripDetail, TripTimelineEvent, TripStatus, TripsListResponse } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";

/** Format retourné par le backend franchise pour la timeline d'une course. */
interface ApiFranchiseTimelineStep {
  status: string;
  at: string | null;
  done: boolean;
  current: boolean;
}

interface ApiFranchiseTimeline {
  current: string;
  steps: ApiFranchiseTimelineStep[];
  statusChain?: string[];
}

/**
 * Convertit le format timeline backend franchise `{ current, steps[], statusChain[] }`
 * vers `TripTimelineEvent[]` attendu par le composant `<Timeline>`.
 *
 * Logique identique à l'admin (`mapTimelineSteps`) avec extension pour les étapes futures :
 * - Étapes avec une date (`at` non null) → affichées normalement (done ou non)
 * - Étapes sans date (`at` null) → affichées en muted (étapes non atteintes)
 * - Étape courante (`current: true`) → variante "warning" (amber)
 * - Tri : passées du plus récent au plus ancien, puis futures dans l'ordre du statusChain
 */
export function mapFranchiseTimelineStepsToEvents(
  timeline: ApiFranchiseTimeline | null | undefined
): TripTimelineEvent[] {
  if (!timeline?.steps?.length) return [];

  const done = timeline.steps
    .filter((s) => s.at != null)
    .map((s, i): TripTimelineEvent => ({
      id: `step-${s.status}-${i}`,
      type: mapApiOrderStatus(s.status) as TripStatus,
      label: liveMapOrderStatusLabel(s.status),
      at: s.at!,
      is_current: s.current || undefined,
    }))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const pending = timeline.steps
    .filter((s) => s.at == null)
    .map((s, i): TripTimelineEvent => ({
      id: `step-pending-${s.status}-${i}`,
      type: mapApiOrderStatus(s.status) as TripStatus,
      label: liveMapOrderStatusLabel(s.status),
      at: "",
      pending: true,
    }));

  return [...done, ...pending];
}

export interface ApiFranchiseOrdersResponse {
  status?: string;
  orders?: ApiLiveMapOrderBase[];
  pagination?: ApiV1Pagination;
}


export function mapFranchiseDriversToPaginated(
  items: ApiAdminDriverItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination
): Paginated<Driver> {
  const rows = items.map(mapAdminDriverItemToListDriver);
  if (serverPagination) {
    return {
      data: rows,
      meta: mapV1PaginationToMeta(serverPagination, params),
    };
  }
  return paginateClientList(rows, params);
}

export function mapFranchiseOrderToTrip(order: ApiLiveMapOrderBase): Trip {
  const amount = order.final_price_xof ?? order.estimated_price_xof ?? 0;
  return {
    id: order.id,
    ref: orderRef(order),
    service: mapApiServiceType(order.service_type),
    from_label: order.pickup_address ?? "—",
    to_label: order.dropoff_address ?? "—",
    client_name:
      order.client?.displayName?.trim() ??
      (order.client_id
        ? `Client ${String(order.client_id).slice(0, 8)}`
        : "Client"),
    driver_name: order.driver?.displayName?.trim() ??
      (order.driver_id
        ? `Chauffeur ${String(order.driver_id).slice(0, 8)}`
        : undefined),
    partner_name: order.partnerName ??
      order.partner?.tradeName ??
      order.partner?.trade_name ??
      undefined,
    partner_id: order.partner_id ? String(order.partner_id) : undefined,
    amount_fcfa: amount,
    status: mapApiOrderStatus(order.status),
    payment_method: mapApiPaymentMethod(order.payment_method_code),
    created_at: order.created_at ?? new Date().toISOString(),
    franchise_id: order.franchise_id
      ? String(order.franchise_id)
      : undefined,
  };
}

export function mapFranchiseOrdersToTripsList(
  response: ApiFranchiseOrdersResponse,
  params?: ListParams,
  partnersResponse?: ApiV1FranchisePartnersResponse
): TripsListResponse {
  const orders = [...(response.orders ?? [])].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime()
  );
  const trips = orders.map(mapFranchiseOrderToTrip);
  const paginated = response.pagination
    ? {
        data: trips,
        meta: mapV1PaginationToMeta(response.pagination, params),
      }
    : paginateClientList(trips, params);

  // Map partners for filter dropdown (filter out invalid IDs)
  const partners = partnersResponse?.items
    ?.filter((p) => p.id && String(p.id).trim() !== "")
    ?.map((p) => ({
      id: String(p.id),
      name: p.trade_name ?? p.legal_name ?? p.name ?? "Partenaire",
      franchise_id: String(p.franchise_id ?? ""),
      franchise_name: p.franchiseName ?? "",
      city: p.cityLabel ?? "",
    })) ?? [];

  return {
    data: paginated.data,
    meta: paginated.meta,
    filter_options: { franchises: [], partners },
  };
}

export function mapFranchiseOrderToTripDetail(
  response: ApiAdminOrderDetailResponse
): TripDetail {
  const payload = response.order;
  if (!payload) {
    throw new Error("Order not found in response");
  }

  // Le ride principal est dans payload.ride, avec fallback sur les champs plats
  const ride = payload.ride ?? ({} as ApiLiveMapOrderBase);
  const rideAny = ride as any;
  const payAny = payload as any;

  const baseTrip = mapFranchiseOrderToTrip({ ...ride, ...payAny } as ApiLiveMapOrderBase);
  const amount = payload.amountXof ?? ride.final_price_xof ?? ride.estimated_price_xof ?? 0;

  // Coordonnées : d'abord tracking, puis champs directs du ride
  const tracking = payload.tracking as any;
  const fromCoords = tracking?.pickup
    ? { lat: tracking.pickup.latitude ?? 0, lng: tracking.pickup.longitude ?? 0 }
    : ride.pickup_latitude != null && ride.pickup_longitude != null
      ? { lat: ride.pickup_latitude, lng: ride.pickup_longitude }
      : undefined;
  const toCoords = tracking?.dropoff
    ? { lat: tracking.dropoff.latitude ?? 0, lng: tracking.dropoff.longitude ?? 0 }
    : ride.dropoff_latitude != null && ride.dropoff_longitude != null
      ? { lat: ride.dropoff_latitude, lng: ride.dropoff_longitude }
      : undefined;

  // Timeline : priorité events[] → steps[] → fallback
  let timeline = mapEventsToTimeline(payload.events);
  if (timeline.length === 0 && payload.timeline?.steps?.length) {
    timeline = mapFranchiseTimelineStepsToEvents(payload.timeline as ApiFranchiseTimeline);
  }

  // Attacher les chauffeurs contactés (offers) à l'event dispatch/matching
  const offers = payload.dispatch?.dispatch?.offers ?? payload.dispatch?.dispatch?.candidates as ApiAdminOrderDispatchOffer[] | undefined;
  const matchingDrivers = mapDispatchOffers(
    offers as ApiAdminOrderDispatchOffer[],
    payload.driverName ?? undefined,
    ride.driver_id ?? undefined
  );
  if (matchingDrivers?.length) {
    const matchingEvent = timeline.find((e) => e.type === "matching");
    if (matchingEvent) matchingEvent.matching_drivers = matchingDrivers;
  }

  return {
    ...baseTrip,
    from_coords: fromCoords,
    to_coords: toCoords,
    client_phone: payload.clientPhone ?? rideAny.client?.phone ?? undefined,
    driver_id: ride.driver_id ?? undefined,
    driver_phone: payload.driverPhone ?? rideAny.driver?.phone ?? undefined,
    vehicle_id: rideAny.vehicle_id ? String(rideAny.vehicle_id) : undefined,
    vehicle_label: rideAny.vehicle?.label ?? undefined,
    vehicle_plate: rideAny.vehicle?.plate ?? undefined,
    driver_location: tracking?.driverLocation ?? undefined,
    commission_fcfa: payload.commissionXof ?? Math.round(amount * 0.15),
    driver_earning_fcfa: payload.driverEarningXof ?? ride.driver_gain_xof ?? Math.round(amount * 0.7),
    zone_name: rideAny.zone_name ?? undefined,
    franchise_name: payload.franchiseName ?? rideAny.franchiseName ?? undefined,
    estimated_arrival_at: rideAny.estimated_arrival_at ?? undefined,
    timeline,
  };
}
