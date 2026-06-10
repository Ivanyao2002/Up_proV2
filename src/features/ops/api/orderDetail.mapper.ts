import type {
  TripDetail,
  TripMatchingDriver,
  TripMatchingOutcome,
  TripTimelineEvent,
} from "@/shared/types";
import type {
  ApiAdminLiveMapResponse,
  ApiLiveMapDriver,
  ApiLiveMapOrderBase,
} from "./liveMap.api.types";
import { liveMapOrderStatusLabel } from "./liveMap.labels";
import {
  formatApiVehicleLabel,
  mapApiLocationToTripDriverLocation,
} from "./adminOrderVehicle";
import {
  extractLiveMapDriverVehicleColor,
  extractLiveMapDriverVehicleColorLabel,
} from "./liveMapVehicleColor";
import { resolveVehicleMapIconUrl } from "@/shared/lib/vehicleMapIcons";
import {
  mapApiOrderStatus,
  mapApiPaymentMethod,
  mapApiServiceType,
  orderRef,
} from "@/features/admin/api/adminOrder.shared";

interface DispatchOffer {
  driverId?: string;
  userId?: string;
  status?: string;
  ratingAvg?: number;
  distanceKm?: number;
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

function mapOfferOutcome(status?: string): TripMatchingOutcome {
  const key = String(status ?? "").toLowerCase();
  if (key === "accepted") return "accepted";
  if (key === "declined" || key === "rejected") return "declined";
  return "no_response";
}

function driverNameById(
  driverId: string | undefined,
  driversById: Map<string, ApiLiveMapDriver>
): string {
  if (!driverId) return "Chauffeur";
  const d = driversById.get(driverId);
  return (
    d?.profile?.displayName ?? d?.driverCode ?? `Chauffeur ${driverId.slice(0, 8)}`
  );
}

function buildMatchingDrivers(
  order: ApiLiveMapOrderBase,
  driversById: Map<string, ApiLiveMapDriver>
): TripMatchingDriver[] | undefined {
  const dispatch = order.metadata?.dispatch as
    | { offers?: DispatchOffer[] }
    | undefined;
  const offers = dispatch?.offers;
  if (!offers?.length) return undefined;

  return offers.map((offer) => ({
    driver_id: offer.driverId ?? offer.userId ?? "",
    driver_name: driverNameById(offer.driverId, driversById),
    outcome: mapOfferOutcome(offer.status),
    reason:
      offer.status === "expired"
        ? "Offre expirée"
        : offer.status === "declined"
          ? "Refusée"
          : undefined,
  }));
}

function buildTimeline(
  order: ApiLiveMapOrderBase,
  driversById: Map<string, ApiLiveMapDriver>
): TripTimelineEvent[] {
  const status = String(order.status ?? "requested").toLowerCase();
  const events: TripTimelineEvent[] = [];

  const push = (
    id: string,
    type: TripTimelineEvent["type"],
    label: string,
    at: string,
    extra?: Partial<TripTimelineEvent>
  ) => {
    events.push({ id, type, label, at, ...extra });
  };

  if (order.completed_at) {
    push("completed", "completed", "Course terminée", order.completed_at);
  }
  if (order.started_at) {
    push("started", "in_progress", "Course démarrée", order.started_at);
  }
  if (order.arrived_at) {
    push("arrived", "arrived", "Chauffeur arrivé", order.arrived_at);
  }
  if (order.accepted_at) {
    push(
      "accepted",
      "assigned",
      "Course acceptée",
      order.accepted_at,
      order.driver_id
        ? {
            description: driverNameById(order.driver_id, driversById),
          }
        : undefined
    );
  }

  const matching = buildMatchingDrivers(order, driversById);
  const dispatchStatus = (
    order.metadata?.dispatch as { status?: string } | undefined
  )?.status;
  if (matching?.length || dispatchStatus === "matching" || status === "matching") {
    push("matching", "matching", "Recherche chauffeur", order.created_at ?? "", {
      description: matching
        ? `${matching.length} chauffeur(s) contacté(s)`
        : "Dispatch en cours",
      matching_drivers: matching,
    });
  }

  if (order.cancelled_at) {
    push("cancelled", "cancelled", "Course annulée", order.cancelled_at);
  }

  push("created", "requested", "Commande créée", order.created_at ?? "");

  return events.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
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

export function indexLiveMapDrivers(
  liveMap: ApiAdminLiveMapResponse
): Map<string, ApiLiveMapDriver> {
  const map = new Map<string, ApiLiveMapDriver>();
  for (const d of liveMap.drivers ?? []) {
    map.set(d.id, d);
  }
  return map;
}

export function mapApiOrderToTripDetail(
  order: ApiLiveMapOrderBase,
  driversById: Map<string, ApiLiveMapDriver>
): TripDetail {
  const amount =
    order.final_price_xof ?? order.estimated_price_xof ?? 0;
  const { commission_fcfa, driver_earning_fcfa } = estimateCommission(amount);
  const status = mapApiOrderStatus(order.status);
  const assignedDriver = order.driver_id
    ? driversById.get(order.driver_id)
    : undefined;

  return {
    id: order.id,
    ref: orderRef(order),
    service: mapApiServiceType(order.service_type),
    from_label: order.pickup_address ?? "Prise en charge",
    to_label: order.dropoff_address ?? "Destination",
    from_coords: readCoord(order.pickup_latitude, order.pickup_longitude),
    to_coords: readCoord(order.dropoff_latitude, order.dropoff_longitude),
    client_name:
      order.client?.displayName?.trim() ??
      (order.client_id
        ? `Client ${String(order.client_id).slice(0, 8)}`
        : "Client"),
    driver_id: order.driver_id ?? undefined,
    driver_name: order.driver_id
      ? driverNameById(order.driver_id, driversById)
      : undefined,
    driver_phone: assignedDriver?.profile?.phone,
    amount_fcfa: amount,
    commission_fcfa,
    driver_earning_fcfa:
      order.driver_gain_xof ?? driver_earning_fcfa,
    status,
    payment_method: mapApiPaymentMethod(order.payment_method_code),
    created_at: order.created_at ?? new Date().toISOString(),
    franchise_name:
      assignedDriver?.franchiseName ?? order.franchiseName ?? undefined,
    partner_id: (() => {
      const id =
        order.partner_id ??
        order.partner?.id ??
        assignedDriver?.partnerId ??
        undefined;
      return id != null ? String(id) : undefined;
    })(),
    partner_name:
      assignedDriver?.partnerName ?? order.partnerName ?? undefined,
    zone_name: assignedDriver?.zoneName,
    timeline: buildTimeline(order, driversById),
    vehicle_label:
      formatApiVehicleLabel(undefined, assignedDriver?.vehicleLabel) ??
      assignedDriver?.vehicleLabel ??
      undefined,
    vehicle_color: assignedDriver
      ? extractLiveMapDriverVehicleColor(assignedDriver) ?? null
      : null,
    vehicle_color_label: assignedDriver
      ? extractLiveMapDriverVehicleColorLabel(assignedDriver) ?? null
      : null,
    vehicle_icon_url: assignedDriver
      ? resolveVehicleMapIconUrl(extractLiveMapDriverVehicleColor(assignedDriver))
      : null,
    driver_location: mapApiLocationToTripDriverLocation(assignedDriver?.location),
  };
}

export function tripDetailStatusLabel(status: string): string {
  return liveMapOrderStatusLabel(status);
}
