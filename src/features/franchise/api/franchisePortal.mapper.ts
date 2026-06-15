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
import type { ApiLiveMapOrderBase } from "@/features/ops/api/liveMap.api.types";
import type { ApiV1FranchisePartnersResponse } from "@/features/network/api/adminFranchises.api.types";
import type { Driver, Paginated, Trip, TripDetail, TripsListResponse } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";

export interface ApiFranchiseOrdersResponse {
  status?: string;
  orders?: ApiLiveMapOrderBase[];
  pagination?: ApiV1Pagination;
}

export interface ApiFranchiseOrderDetailResponse {
  status?: string;
  order?: ApiLiveMapOrderBase;
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
  response: ApiFranchiseOrderDetailResponse
): TripDetail {
  const order = response.order;
  if (!order) {
    throw new Error("Order not found in response");
  }

  const baseTrip = mapFranchiseOrderToTrip(order);
  const amount = order.final_price_xof ?? order.estimated_price_xof ?? 0;

  return {
    ...baseTrip,
    // Use type assertion for fields that may exist but aren't in the base type
    from_coords: (order as any).pickup_location
      ? {
          lat: (order as any).pickup_location.lat ?? (order as any).pickup_location.latitude ?? 0,
          lng: (order as any).pickup_location.lng ?? (order as any).pickup_location.longitude ?? 0,
        }
      : undefined,
    to_coords: (order as any).dropoff_location
      ? {
          lat: (order as any).dropoff_location.lat ?? (order as any).dropoff_location.latitude ?? 0,
          lng: (order as any).dropoff_location.lng ?? (order as any).dropoff_location.longitude ?? 0,
        }
      : undefined,
    client_phone: order.client?.phone ?? undefined,
    driver_id: order.driver_id ?? undefined,
    driver_phone: order.driver?.phone ?? undefined,
    vehicle_id: (order as any).vehicle_id ? String((order as any).vehicle_id) : undefined,
    vehicle_label: (order as any).vehicle?.label ?? undefined,
    vehicle_plate: (order as any).vehicle?.plate ?? undefined,
    driver_location: (order as any).driver_location,
    commission_fcfa: (order as any).commission_xof ?? Math.round(amount * 0.15),
    driver_earning_fcfa: (order as any).driver_earning_xof ?? (order as any).driver_gain_xof ?? Math.round(amount * 0.7),
    zone_name: (order as any).zone_name ?? undefined,
    franchise_name: (order as any).franchise_name ?? (order as any).franchiseName ?? undefined,
    estimated_arrival_at: (order as any).estimated_arrival_at ?? undefined,
    timeline: Array.isArray((order as any).timeline) ? (order as any).timeline : [],
  };
}
