import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import { mapApiOrderStatus, orderRef } from "@/features/admin/api/adminOrder.shared";
import type { FleetClient, FleetClientDetail } from "./clients.service";
import type {
  ApiAdminUserDetailResponse,
  ApiAdminUserItem,
} from "./adminUsers.api.types";

function mapUserStatus(status?: string | null): FleetClient["status"] {
  const key = String(status ?? "active").toLowerCase();
  return key === "suspended" ? "suspended" : "active";
}

export function mapAdminUserItemToFleetClient(
  item: ApiAdminUserItem
): FleetClient {
  const firstName = item.first_name ?? "";
  const lastName = item.last_name ?? "";
  const fullName =
    item.fullName?.trim() ||
    item.display_name?.trim() ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    item.email ||
    `Client ${item.id.slice(0, 8)}`;
  const rawType = String(item.userType ?? item.user_type ?? "CLIENT").toUpperCase();
  return {
    id: item.id,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    phone: item.phone ?? "—",
    email: item.email ?? null,
    type: rawType === "B2B" ? "b2b" : "b2c",
    user_type: rawType,
    status: mapUserStatus(item.status),
    trips_count: item.tripsCount ?? item.trips_count ?? 0,
    wallet_balance_fcfa: item.walletBalanceXof ?? item.wallet_balance_xof ?? 0,
    registered_at: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    last_trip_at: item.lastTripAt ?? item.last_trip_at ?? null,
  };
}

function clientMatchesFilters(client: FleetClient, params?: ListParams): boolean {
  if (params?.status && params.status !== "all" && client.status !== params.status) {
    return false;
  }
  if (params?.type && params.type !== "all" && client.type !== params.type) {
    return false;
  }
  if (params?.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    const haystack = [client.full_name, client.phone, client.email ?? ""]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function mapAdminUsersToPaginated(
  users: ApiAdminUserItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination
): Paginated<FleetClient> {
  const clients = users
    .filter((u) => String(u.userType ?? "CLIENT").toUpperCase() === "CLIENT")
    .map(mapAdminUserItemToFleetClient)
    .filter((c) => clientMatchesFilters(c, params));

  if (serverPagination) {
    return {
      data: clients,
      meta: mapV1PaginationToMeta(serverPagination, params),
    };
  }

  return paginateClientList(clients, params, (c) =>
    clientMatchesFilters(c, params)
  );
}

export function mapAdminUserDetailToFleetClientDetail(
  response: ApiAdminUserDetailResponse
): FleetClientDetail {
  const user = response.user;
  if (!user?.id) {
    throw new Error("USER_NOT_FOUND");
  }

  const base = mapAdminUserItemToFleetClient(user);
  const tripsTotal =
    user.tripsCount ??
    response.profile?.orders_completed_count ??
    base.trips_count;
  const wallet = user.walletBalanceXof ?? base.wallet_balance_fcfa;

  const recent_trips = (response.recentOrders ?? []).map((order) => {
    const amount =
      order.amountXof ??
      order.final_price_xof ??
      order.estimated_price_xof ??
      0;
    const ref =
      order.orderReference?.trim() ||
      order.order_reference?.trim() ||
      (order.id
        ? orderRef({
            id: order.id,
            order_reference: order.orderReference ?? order.order_reference,
          })
        : "—");

    return {
      id: order.id ?? "",
      ref,
      from_label:
        order.pickupAddress?.trim() ||
        order.pickup_address?.trim() ||
        "—",
      to_label:
        order.dropoffAddress?.trim() ||
        order.dropoff_address?.trim() ||
        "—",
      status: mapApiOrderStatus(order.status),
      amount_fcfa: amount,
      created_at:
        order.createdAt ?? order.created_at ?? new Date().toISOString(),
    };
  });

  const pricedTrips = recent_trips.filter((t) => t.amount_fcfa > 0);
  const avgFare =
    pricedTrips.length > 0
      ? Math.round(
          pricedTrips.reduce((sum, t) => sum + t.amount_fcfa, 0) /
            pricedTrips.length
        )
      : 0;

  return {
    ...base,
    trips_count: tripsTotal,
    wallet_balance_fcfa: wallet,
    stats: {
      trips_total: tripsTotal,
      trips_cancelled: 0,
      wallet_balance_fcfa: wallet,
      total_spent_fcfa: 0,
      avg_fare_fcfa: avgFare,
    },
    recent_trips,
  };
}
