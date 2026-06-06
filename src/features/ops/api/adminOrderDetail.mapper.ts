import type {
  TripDetail,
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
  "dispatch.started": "Dispatch démarré",
  "dispatch.abandoned": "Dispatch abandonné",
  "dispatch.offer_timeout": "Offres expirées",
  "dispatch.offer_accepted": "Offre acceptée",
  "dispatch.offer_declined": "Offre refusée",
};

function readCoord(
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number } | undefined {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return undefined;
  }
  return { lat, lng };
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
  if (key.includes("accept") || key.includes("assigned")) return "assigned";
  if (key.includes("dispatch") || key.includes("matching")) return "matching";
  return "requested";
}

function mapDispatchOffers(
  offers: ApiAdminOrderDispatchOffer[] | undefined
): TripMatchingDriver[] | undefined {
  if (!offers?.length) return undefined;
  return offers.map((offer) => ({
    driver_id: offer.driverId ?? offer.userId ?? "",
    driver_name: offer.driverId
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

function mapEventsToTimeline(
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
      label: EVENT_LABELS[ev.event_type] ?? ev.event_type.replace(/\./g, " "),
      at: ev.created_at,
      description:
        ev.new_status && ev.old_status
          ? `${liveMapOrderStatusLabel(ev.old_status)} → ${liveMapOrderStatusLabel(ev.new_status)}`
          : undefined,
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
  const matchingDrivers = mapDispatchOffers(offers);

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

  return {
    id: ride.id,
    ref: payload.ref ?? orderRef(ride),
    service: mapApiServiceType(ride.service_type ?? payload.serviceType),
    from_label: ride.pickup_address ?? "Prise en charge",
    to_label: ride.dropoff_address ?? "Destination",
    from_coords: readCoord(ride.pickup_latitude, ride.pickup_longitude),
    to_coords: readCoord(ride.dropoff_latitude, ride.dropoff_longitude),
    client_name: payload.clientName ?? ride.client?.displayName ?? "Client",
    client_phone: payload.clientPhone ?? ride.client?.phone ?? undefined,
    driver_id: ride.driver_id ?? payload.driver?.id ?? undefined,
    driver_name:
      payload.driverName ??
      payload.driver?.displayName ??
      ride.driver?.displayName ??
      undefined,
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
  };
}
