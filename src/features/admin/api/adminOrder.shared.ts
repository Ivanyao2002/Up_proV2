import type { Trip, TripStatus } from "@/shared/types";
import type {
  ApiAdminLiveMapResponse,
  ApiLiveMapOrderBase,
} from "@/features/ops/api/liveMap.api.types";
import type { ApiAdminOrdersResponse } from "@/features/ops/api/adminOrders.api.types";

export function orderRef(order: { id: string; order_reference?: string | null }): string {
  if (order.order_reference) return order.order_reference;
  return `TR-${String(order.id).slice(0, 8).toUpperCase()}`;
}

export function resolveOrderClientId(
  order: Pick<ApiLiveMapOrderBase, "client_id" | "client">
): string | undefined {
  const id = order.client_id ?? order.client?.id;
  if (id == null) return undefined;
  const value = String(id).trim();
  return value || undefined;
}

const SERVICE_MAP: Record<string, Trip["service"]> = {
  RIDE: "taxi",
  TAXI: "taxi",
  DELIVERY: "delivery",
  DELIVERY_CARGO: "delivery",
  RENTAL: "rental",
  FREIGHT: "freight",
};

export function mapApiServiceType(code?: string | null): Trip["service"] {
  const key = String(code ?? "RIDE").toUpperCase();
  return SERVICE_MAP[key] ?? "taxi";
}

const STATUS_MAP: Record<string, TripStatus> = {
  requested: "requested",
  dispatching: "matching",
  matching: "matching",
  assigned: "assigned",
  accepted: "assigned",
  arrived: "arrived",
  in_progress: "in_progress",
  started: "in_progress",
  picked_up: "in_progress",
  completed: "completed",
  cancelled: "cancelled",
};

export function mapApiOrderStatus(status?: string | null): TripStatus {
  const key = String(status ?? "requested").toLowerCase();
  return STATUS_MAP[key] ?? "requested";
}

export function mapApiPaymentMethod(
  code?: string | null
): Trip["payment_method"] {
  const key = String(code ?? "CASH").toUpperCase();
  if (key === "WALLET") return "wallet";
  if (key === "CARD") return "card";
  if (key === "ORANGE_MONEY" || key === "OM") return "orange_money";
  return "cash";
}

export function splitDisplayName(displayName?: string | null): {
  first_name: string;
  last_name: string;
} {
  const raw = String(displayName ?? "Chauffeur").trim();
  const parts = raw.split(/\s+/);
  if (parts.length <= 1) {
    return { first_name: raw, last_name: "" };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export function collectOrdersFromLiveMap(
  data: ApiAdminLiveMapResponse
): ApiLiveMapOrderBase[] {
  return [...(data.orders?.rides ?? []), ...(data.orders?.deliveries ?? [])];
}

export function findOrderById(
  orders: ApiLiveMapOrderBase[],
  id: string
): ApiLiveMapOrderBase | undefined {
  return orders.find((o) => o.id === id);
}

export function findOrderInResponses(
  liveMap: ApiAdminLiveMapResponse | null,
  ordersList: ApiAdminOrdersResponse | null,
  id: string
): ApiLiveMapOrderBase | undefined {
  if (liveMap) {
    const fromLive = findOrderById(collectOrdersFromLiveMap(liveMap), id);
    if (fromLive) return fromLive;
  }
  if (ordersList) {
    const rides = [...(ordersList.rides ?? []), ...(ordersList.deliveries ?? [])];
    return findOrderById(rides, id);
  }
  return undefined;
}
