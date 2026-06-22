import type {
  TripDetail,
  TripFinanceSnapshot,
  TripMatchingDriver,
  TripMatchingOutcome,
  TripTimelineEvent,
  TripStatus,
} from "@/shared/types";
import {
  mapApiOrderStatus,
  mapApiPaymentMethod,
  mapApiServiceType,
  orderRef,
  resolveOrderClientId,
} from "@/features/admin/api/adminOrder.shared";
import type {
  ApiAdminOrderDetailPayload,
  ApiAdminOrderEvent,
  ApiAdminOrderDispatchOffer,
} from "./adminOrderDetail.api.types";
import type { ApiLiveMapOrderBase } from "./liveMap.api.types";
import { liveMapOrderStatusLabel } from "./liveMap.labels";
import { extractTripVehicleFields } from "./adminOrderVehicle";

const EVENT_LABELS: Record<string, string> = {
  "ride.created": "Commande créée",
  "ride.cancel": "Course annulée",
  "ride.arrived": "Chauffeur arrivé sur place",
  "ride.start": "Course démarrée",
  "ride.complete": "Course terminée",
  "dispatch.started": "Recherche de chauffeur démarrée",
  "dispatch.abandoned": "Dispatch abandonné",
  "dispatch.offer_timeout": "Offres expirées",
  "dispatch.offer_accepted": "Offre acceptée",
  "dispatch.offer_declined": "Offre refusée",
  "dispatch.offer_received": "Offre envoyée au chauffeur",
  "dispatch.no_driver": "Aucun chauffeur disponible",
};

function eventTypeLabel(eventType: string): string {
  if (EVENT_LABELS[eventType]) return EVENT_LABELS[eventType];
  const normalized = eventType.replace(/\./g, " ").replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatStatusTransition(
  oldStatus?: string | null,
  newStatus?: string | null
): string | undefined {
  if (!oldStatus && !newStatus) return undefined;
  const oldKey = String(oldStatus ?? "").toLowerCase();
  const newKey = String(newStatus ?? "").toLowerCase();
  if (oldKey && newKey && oldKey === newKey) return undefined;
  const oldLabel = liveMapOrderStatusLabel(oldStatus ?? undefined);
  const newLabel = liveMapOrderStatusLabel(newStatus ?? undefined);
  if (oldStatus && newStatus) return `${oldLabel} → ${newLabel}`;
  return newStatus ? newLabel : oldLabel;
}

function resolveOrderDriverName(
  payload: ApiAdminOrderDetailPayload,
  ride: ApiLiveMapOrderBase
): string | undefined {
  const explicit = payload.driverName?.trim();
  if (explicit) return explicit;

  const driverBlock = payload.driver as Record<string, unknown> | null | undefined;
  if (driverBlock && typeof driverBlock === "object") {
    const summary = driverBlock.summary as Record<string, unknown> | undefined;
    const profile = driverBlock.profile as Record<string, unknown> | undefined;
    const fromSummary =
      summary?.displayName ?? summary?.name ?? summary?.display_name;
    if (typeof fromSummary === "string" && fromSummary.trim()) {
      return fromSummary.trim();
    }

    const first = profile?.firstName ?? profile?.first_name;
    const last = profile?.lastName ?? profile?.last_name;
    const joined = [first, last].filter((v) => typeof v === "string" && v.trim()).join(" ");
    if (joined) return joined;

    const flat =
      driverBlock.displayName ??
      driverBlock.display_name ??
      profile?.displayName ??
      profile?.display_name;
    if (typeof flat === "string" && flat.trim()) return flat.trim();
  }

  const summary = payload.driverSummary as Record<string, unknown> | null | undefined;
  const fromSummary =
    summary?.displayName ?? summary?.name ?? summary?.display_name;
  if (typeof fromSummary === "string" && fromSummary.trim()) {
    return fromSummary.trim();
  }

  return ride.driver?.displayName ?? undefined;
}

function readCoord(
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number } | undefined {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return undefined;
  }
  return { lat, lng };
}

function readRideField(
  ride: ApiLiveMapOrderBase & Record<string, unknown>,
  snake: string,
  camel: string
): string | undefined {
  const snakeVal = ride[snake];
  if (typeof snakeVal === "string" && snakeVal.trim()) return snakeVal.trim();
  const camelVal = ride[camel];
  if (typeof camelVal === "string" && camelVal.trim()) return camelVal.trim();
  return undefined;
}

function readRideNumber(
  ride: ApiLiveMapOrderBase & Record<string, unknown>,
  ...keys: string[]
): number | null | undefined {
  for (const key of keys) {
    const v = ride[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function resolveTripRouteFields(
  ride: ApiLiveMapOrderBase,
  tracking?: Record<string, unknown> | null
) {
  const r = ride as ApiLiveMapOrderBase & Record<string, unknown>;
  const t = tracking ?? {};

  const from_label =
    readRideField(r, "pickup_address", "pickupAddress") ??
    (typeof t.pickup_address === "string" && t.pickup_address.trim()
      ? t.pickup_address.trim()
      : undefined) ??
    (typeof t.pickupAddress === "string" && t.pickupAddress.trim()
      ? t.pickupAddress.trim()
      : undefined) ??
    "Prise en charge";

  const to_label =
    readRideField(r, "dropoff_address", "dropoffAddress") ??
    (typeof t.dropoff_address === "string" && t.dropoff_address.trim()
      ? t.dropoff_address.trim()
      : undefined) ??
    (typeof t.dropoffAddress === "string" && t.dropoffAddress.trim()
      ? t.dropoffAddress.trim()
      : undefined) ??
    "Destination";

  const from_coords =
    readCoord(
      readRideNumber(r, "pickup_latitude", "pickupLatitude") ??
        (typeof t.pickup_latitude === "number" ? t.pickup_latitude : undefined) ??
        (typeof t.pickupLatitude === "number" ? t.pickupLatitude : undefined),
      readRideNumber(r, "pickup_longitude", "pickupLongitude") ??
        (typeof t.pickup_longitude === "number" ? t.pickup_longitude : undefined) ??
        (typeof t.pickupLongitude === "number" ? t.pickupLongitude : undefined)
    ) ?? undefined;

  const to_coords =
    readCoord(
      readRideNumber(r, "dropoff_latitude", "dropoffLatitude") ??
        (typeof t.dropoff_latitude === "number" ? t.dropoff_latitude : undefined) ??
        (typeof t.dropoffLatitude === "number" ? t.dropoffLatitude : undefined),
      readRideNumber(r, "dropoff_longitude", "dropoffLongitude") ??
        (typeof t.dropoff_longitude === "number" ? t.dropoff_longitude : undefined) ??
        (typeof t.dropoffLongitude === "number" ? t.dropoffLongitude : undefined)
    ) ?? undefined;

  return { from_label, to_label, from_coords, to_coords };
}

function mapOfferOutcome(status?: string): TripMatchingOutcome {
  const key = String(status ?? "").toLowerCase();
  if (key === "accepted") return "accepted";
  if (key === "declined" || key === "rejected") return "declined";
  return "no_response";
}

function eventTypeToTripStatus(eventType: string): TripTimelineEvent["type"] {
  const key = eventType.toLowerCase();
  if (key.includes("cancel")) return "cancelled";
  if (key.includes("complete")) return "completed";
  if (key.includes("arrived")) return "arrived";
  if (key.includes("start") || key.includes("in_progress")) return "in_progress";
  if (key.includes("accept") || key.includes("assigned")) return "assigned";
  if (
    key.includes("dispatch") ||
    key.includes("matching") ||
    key.includes("no_driver") ||
    key.includes("offer")
  ) {
    return "matching";
  }
  return "requested";
}

export function mapDispatchOffers(
  offers: ApiAdminOrderDispatchOffer[] | undefined,
  driverName?: string,
  assignedDriverId?: string
): TripMatchingDriver[] | undefined {
  if (!offers?.length) return undefined;
  return offers.map((offer) => ({
    driver_id: offer.driverId ?? offer.userId ?? "",
    driver_name:
      driverName &&
      (offers.length === 1 || offer.driverId === assignedDriverId)
        ? driverName
        : offer.driverId
          ? `Chauffeur ${offer.driverId.slice(0, 8)}`
          : "Chauffeur",
    outcome: mapOfferOutcome(offer.status),
    reason:
      offer.status === "timeout" || offer.status === "expired"
        ? "Offre expirée"
        : offer.status === "declined"
          ? "Refusée"
          : undefined,
  }));
}

export function mapEventsToTimeline(
  events: ApiAdminOrderEvent[] | undefined
): TripTimelineEvent[] {
  if (!events?.length) return [];
  return [...events]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((ev) => ({
      id: ev.id,
      type: eventTypeToTripStatus(ev.event_type),
      label: eventTypeLabel(ev.event_type),
      at: ev.created_at,
      description: formatStatusTransition(ev.old_status, ev.new_status),
    }));
}

function mapTimelineSteps(
  payload: ApiAdminOrderDetailPayload
): TripTimelineEvent[] {
  const steps = payload.timeline?.steps ?? [];
  return steps
    .filter((s) => s.done && s.at)
    .map((s, i) => ({
      id: `step-${s.status}-${i}`,
      type: mapApiOrderStatus(s.status) as TripStatus,
      label: liveMapOrderStatusLabel(s.status),
      at: s.at!,
    }));
}

function resolveRide(payload: ApiAdminOrderDetailPayload): ApiLiveMapOrderBase {
  const ride = payload.ride ?? ({} as ApiLiveMapOrderBase);
  return {
    ...ride,
    id: ride.id ?? payload.orderId ?? "",
    order_reference: ride.order_reference ?? payload.ref ?? undefined,
    service_type: ride.service_type ?? payload.serviceType,
  };
}

function readNum(obj: Record<string, unknown> | null | undefined, ...keys: string[]): number | undefined {
  if (!obj) return undefined;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function mapTripFinanceSnapshotFromWallet(
  payload: ApiAdminOrderDetailPayload,
  orderId: string,
  amount: number
): TripFinanceSnapshot | undefined {
  const driverBlock = payload.driver as Record<string, unknown> | null | undefined;
  const wallet = driverBlock?.wallet as Record<string, unknown> | undefined;
  const movements = (wallet?.recentMovements ?? wallet?.recent_movements) as
    | Array<Record<string, unknown>>
    | undefined;
  const movement = movements?.find(
    (m) => m.order_id === orderId || m.orderId === orderId
  );
  if (!movement) return undefined;

  const meta = movement.metadata as Record<string, unknown> | undefined;
  if (!meta) return undefined;

  const breakdown = {
    platform_fcfa: readNum(meta, "platformAmountXof", "platform_amount_xof"),
    franchise_fcfa: readNum(meta, "franchiseAmountXof", "franchise_amount_xof"),
    partner_fcfa: readNum(meta, "partnerAmountXof", "partner_amount_xof"),
    fiscality_fcfa: readNum(meta, "fiscalityAmountXof", "fiscality_amount_xof"),
    driver_fcfa: readNum(meta, "driverAmountXof", "driver_amount_xof"),
  };
  const hasBreakdown = Object.values(breakdown).some((v) => v != null && v > 0);

  return {
    cash_received_fcfa: readNum(meta, "grossAmountXof", "gross_amount_xof") ?? amount,
    commission_status: "debited",
    commission_breakdown: hasBreakdown ? breakdown : undefined,
  };
}

function mapTripFinanceSnapshot(
  payload: ApiAdminOrderDetailPayload,
  amount: number,
  orderId: string
): TripFinanceSnapshot | undefined {
  const fromWallet = mapTripFinanceSnapshotFromWallet(payload, orderId, amount);
  const receipt = payload.receipt as Record<string, unknown> | null | undefined;
  const pricing = payload.pricing as Record<string, unknown> | null | undefined;
  const breakdownRaw =
    (receipt?.commissionBreakdown as Record<string, unknown> | undefined) ??
    (receipt?.commission_breakdown as Record<string, unknown> | undefined) ??
    (pricing?.commissionBreakdown as Record<string, unknown> | undefined);

  const breakdown = breakdownRaw
    ? {
        platform_fcfa: readNum(breakdownRaw, "platformAmountXof", "platform_amount_xof", "platform_fcfa"),
        franchise_fcfa: readNum(breakdownRaw, "franchiseAmountXof", "franchise_amount_xof", "franchise_fcfa"),
        partner_fcfa: readNum(breakdownRaw, "partnerAmountXof", "partner_amount_xof", "partner_fcfa"),
        fiscality_fcfa: readNum(breakdownRaw, "fiscalityAmountXof", "fiscality_amount_xof", "fiscality_fcfa"),
        driver_fcfa: readNum(breakdownRaw, "driverAmountXof", "driver_amount_xof", "driver_fcfa"),
      }
    : undefined;

  const hasBreakdown =
    breakdown &&
    Object.values(breakdown).some((v) => v != null && v > 0);

  const walletBefore = readNum(receipt, "walletBeforeXof", "wallet_before_xof", "wallet_before_fcfa");
  const walletAfter = readNum(receipt, "walletAfterXof", "wallet_after_xof", "wallet_after_fcfa");
  const cashReceived = readNum(receipt, "cashReceivedXof", "cash_received_xof", "cash_received_fcfa");
  const commissionStatus =
    (receipt?.commissionStatus as string | undefined) ??
    (receipt?.commission_status as string | undefined);

  if (!hasBreakdown && walletBefore == null && walletAfter == null && !commissionStatus) {
    return fromWallet ?? (cashReceived != null && cashReceived !== amount
      ? { cash_received_fcfa: cashReceived }
      : undefined);
  }

  return {
    cash_received_fcfa: cashReceived ?? fromWallet?.cash_received_fcfa ?? amount,
    wallet_before_fcfa: walletBefore ?? null,
    wallet_after_fcfa: walletAfter ?? null,
    commission_status: commissionStatus ?? fromWallet?.commission_status,
    commission_breakdown: hasBreakdown ? breakdown : fromWallet?.commission_breakdown,
  };
}

function estimateCommission(amount: number): {
  commission_fcfa: number;
  driver_earning_fcfa: number;
} {
  const commission = Math.round(amount * 0.15);
  return {
    commission_fcfa: commission,
    driver_earning_fcfa: Math.max(0, amount - commission),
  };
}

/** Mappe GET /v1/admin/orders/:id vers TripDetail UI. */
export function mapAdminOrderDetailToTripDetail(
  payload: ApiAdminOrderDetailPayload
): TripDetail {
  const ride = resolveRide(payload);
  const amount =
    payload.amountXof ??
    ride.final_price_xof ??
    ride.estimated_price_xof ??
    0;
  const fallback = estimateCommission(amount);
  const offers =
    payload.dispatch?.dispatch?.offers ??
    payload.dispatch?.dispatch?.candidates;
  const resolvedDriverName = resolveOrderDriverName(payload, ride);
  const assignedDriverId =
    ride.driver_id ??
    payload.driverSummary?.id?.toString() ??
    (payload.driver as { driver?: { id?: string } } | null | undefined)?.driver
      ?.id;
  const matchingDrivers = mapDispatchOffers(
    offers,
    resolvedDriverName,
    assignedDriverId ? String(assignedDriverId) : undefined
  );

  const partnerId = ride.partner_id ?? ride.partner?.id;
  const franchiseId = ride.franchise_id ?? ride.franchise?.id;
  const partnerName =
    payload.partnerName ??
    ride.partnerName ??
    ride.partner?.tradeName ??
    ride.partner?.trade_name ??
    ride.partner?.displayName ??
    undefined;
  const franchiseName =
    payload.franchiseName ?? ride.franchiseName ?? ride.franchise?.name ?? undefined;

  let timeline = mapEventsToTimeline(payload.events);
  if (timeline.length === 0) {
    timeline = mapTimelineSteps(payload);
  }
  if (timeline.length === 0 && ride.created_at) {
    timeline = [
      {
        id: "created",
        type: "requested",
        label: "Commande créée",
        at: ride.created_at,
      },
    ];
  }

  const matchingEvent = timeline.find((e) => e.type === "matching");
  if (matchingDrivers?.length && matchingEvent) {
    matchingEvent.matching_drivers = matchingDrivers;
  }

  const status = mapApiOrderStatus(
    payload.timeline?.current ?? ride.status
  );
  const vehicleFields = extractTripVehicleFields(payload);
  const route = resolveTripRouteFields(ride, payload.tracking);

  return {
    id: ride.id,
    ref: payload.ref ?? orderRef(ride),
    service: mapApiServiceType(ride.service_type ?? payload.serviceType),
    from_label: route.from_label,
    to_label: route.to_label,
    from_coords: route.from_coords,
    to_coords: route.to_coords,
    client_name: payload.clientName ?? ride.client?.displayName ?? "Client",
    client_id: resolveOrderClientId(ride),
    client_phone: payload.clientPhone ?? ride.client?.phone ?? undefined,
    driver_id: ride.driver_id ?? payload.driver?.id ?? undefined,
    driver_name: resolvedDriverName,
    driver_phone:
      payload.driverPhone ??
      payload.driver?.phone ??
      ride.driver?.phone ??
      undefined,
    amount_fcfa: amount,
    commission_fcfa: payload.commissionXof ?? fallback.commission_fcfa,
    driver_earning_fcfa:
      payload.driverEarningXof ??
      ride.driver_gain_xof ??
      fallback.driver_earning_fcfa,
    status,
    payment_method: mapApiPaymentMethod(ride.payment_method_code),
    created_at: ride.created_at ?? new Date().toISOString(),
    franchise_id: franchiseId ? String(franchiseId) : undefined,
    franchise_name: franchiseName,
    partner_id: partnerId ? String(partnerId) : undefined,
    partner_name: partnerName,
    ...vehicleFields,
    timeline,
    finance: mapTripFinanceSnapshot(payload, amount, ride.id),
  };
}
