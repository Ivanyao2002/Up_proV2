import type { TripDetail, TripTimelineEvent, TripStatus } from "@/shared/types";
import {
  mapApiPaymentMethod,
  mapApiServiceType,
} from "@/features/admin/api/adminOrder.shared";
import type { ApiAdminOrderDetailPayload } from "@/features/ops/api/adminOrderDetail.api.types";
import { mapAdminOrderDetailToTripDetail } from "@/features/ops/api/adminOrderDetail.mapper";
import type { ApiLiveMapOrderBase } from "@/features/ops/api/liveMap.api.types";
import {
  mapFranchiseOrderToTripDetail,
} from "@/features/franchise/api/franchisePortal.mapper";
import {
  formatApiVehicleLabel,
  mapApiLocationToTripDriverLocation,
} from "@/features/ops/api/adminOrderVehicle";
import { resolveVehicleMapIconUrl } from "@/shared/lib/vehicleMapIcons";
import {
  mapApiBookingItemToPartnerBooking,
  type ApiBookingItem,
} from "./bookings.service";

export interface PartnerOrderDetailApiResponse {
  status?: string;
  trip?: Record<string, unknown>;
  order?: Record<string, unknown>;
  events?: Array<{
    id: string;
    event_type: string;
    old_status?: string | null;
    new_status?: string | null;
    created_at: string;
  }>;
}

export interface PartnerTripDetail extends TripDetail {
  payment_status?: string | null;
  notes?: string;
  category_code?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
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

function readCoord(
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number } | undefined {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return undefined;
  }
  return { lat, lng };
}

function isAdminOrderDetailPayload(raw: Record<string, unknown>): boolean {
  return Boolean(
    raw.ride ||
      raw.events ||
      raw.timeline ||
      raw.amountXof != null ||
      raw.clientName
  );
}

function eventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    "ride.created": "Commande créée",
    "ride.cancel": "Course annulée",
    "ride.arrived": "Chauffeur arrivé sur place",
    "ride.start": "Course démarrée",
    "ride.complete": "Course terminée",
    "dispatch.started": "Recherche de chauffeur démarrée",
    "dispatch.offer_accepted": "Offre acceptée",
    "dispatch.no_driver": "Aucun chauffeur disponible",
  };
  if (labels[eventType]) return labels[eventType];
  const normalized = eventType.replace(/\./g, " ").replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function eventTypeToTripStatus(eventType: string): TripTimelineEvent["type"] {
  const key = eventType.toLowerCase();
  if (key.includes("cancel")) return "cancelled";
  if (key.includes("complete")) return "completed";
  if (key.includes("arrived")) return "arrived";
  if (key.includes("start") || key.includes("in_progress")) return "in_progress";
  if (key.includes("accept") || key.includes("assigned")) return "assigned";
  if (key.includes("dispatch") || key.includes("matching") || key.includes("offer")) {
    return "matching";
  }
  return "requested";
}

function mapApiEventsToTimeline(
  events: PartnerOrderDetailApiResponse["events"]
): TripTimelineEvent[] {
  if (!events?.length) return [];
  return [...events]
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .map((event) => ({
      id: event.id,
      type: eventTypeToTripStatus(event.event_type),
      label: eventTypeLabel(event.event_type),
      at: event.created_at,
    }));
}

function buildTimelineFromMilestones(
  raw: Record<string, unknown>,
  status: TripStatus
): TripTimelineEvent[] {
  const events: TripTimelineEvent[] = [];
  const push = (
    id: string,
    type: TripTimelineEvent["type"],
    label: string,
    at?: string
  ) => {
    if (at) events.push({ id, type, label, at });
  };

  push(
    "created",
    "requested",
    "Commande créée",
    readString(raw, "created_at", "createdAt")
  );
  push(
    "accepted",
    "assigned",
    "Chauffeur assigné",
    readString(raw, "accepted_at", "acceptedAt")
  );
  push(
    "arrived",
    "arrived",
    "Chauffeur arrivé",
    readString(raw, "arrived_at", "arrivedAt")
  );
  push(
    "started",
    "in_progress",
    "Course démarrée",
    readString(raw, "started_at", "startedAt")
  );
  push(
    "completed",
    "completed",
    "Course terminée",
    readString(raw, "completed_at", "completedAt")
  );
  push(
    "cancelled",
    "cancelled",
    "Course annulée",
    readString(raw, "cancelled_at", "cancelledAt")
  );

  if (events.length === 0) {
    const createdAt = readString(raw, "created_at", "createdAt");
    if (createdAt) {
      events.push({
        id: "created",
        type: status === "cancelled" ? "cancelled" : "requested",
        label: status === "cancelled" ? "Course annulée" : "Commande créée",
        at: createdAt,
      });
    }
  }

  return events;
}

function resolveVehicleFields(raw: Record<string, unknown>) {
  const vehicle = raw.vehicle as Record<string, unknown> | undefined;
  const vehicleId =
    readString(raw, "vehicle_id", "vehicleId") ??
    readString(vehicle ?? {}, "id");
  const vehiclePlate =
    readString(vehicle ?? {}, "plate", "plateNumber", "license_plate", "plate_number") ??
    readString(raw, "vehicle_plate", "vehiclePlate");
  const vehicleLabel =
    readString(vehicle ?? {}, "label", "displayName", "name") ??
    (vehicle
      ? [readString(vehicle, "brand", "brandLabel"), readString(vehicle, "model", "modelLabel")]
          .filter(Boolean)
          .join(" ") || undefined
      : undefined) ??
    vehiclePlate;

  return {
    vehicle_id: vehicleId,
    vehicle_plate: vehiclePlate,
    vehicle_label: vehicleLabel,
  };
}

function mapPartnerTripPayloadToTripDetail(
  raw: Record<string, unknown>,
  envelope?: PartnerOrderDetailApiResponse
): PartnerTripDetail {
  const booking = mapApiBookingItemToPartnerBooking(raw as unknown as ApiBookingItem);
  const amount = booking.amount_fcfa ?? 0;
  const commission =
    readNumber(raw, "commission_xof", "commissionXof", "commission_fcfa") ??
    Math.round(amount * 0.15);
  const driverEarning =
    readNumber(
      raw,
      "driver_earning_xof",
      "driverEarningXof",
      "driver_gain_xof",
      "driver_earning_fcfa"
    ) ?? Math.max(0, amount - commission);

  const timelineFromEvents = mapApiEventsToTimeline(envelope?.events);
  const timelineFromRaw = Array.isArray(raw.timeline)
    ? (raw.timeline as TripTimelineEvent[])
    : [];
  const timeline =
    timelineFromEvents.length > 0
      ? timelineFromEvents
      : timelineFromRaw.length > 0
        ? timelineFromRaw
        : buildTimelineFromMilestones(raw, booking.status);

  const vehicle = resolveVehicleFields(raw);
  const vehicleRaw = raw.vehicle as Record<string, unknown> | undefined;
  const serviceCode = readString(raw, "service_type", "serviceType", "service");
  const tracking = raw.tracking as Record<string, unknown> | undefined;
  const driverLocation =
    mapApiLocationToTripDriverLocation(
      raw.driver_location as Record<string, unknown> | undefined
    ) ??
    mapApiLocationToTripDriverLocation(
      tracking?.driverLocation as Record<string, unknown> | undefined
    ) ??
    mapApiLocationToTripDriverLocation(
      (raw.driver as Record<string, unknown> | undefined)?.location as
        | Record<string, unknown>
        | undefined
    );

  return {
    id: booking.id,
    ref: booking.ref,
    service: booking.service ?? mapApiServiceType(serviceCode),
    from_label: booking.from_label,
    to_label: booking.to_label,
    from_coords: readCoord(booking.from_lat, booking.from_lng),
    to_coords: readCoord(booking.to_lat, booking.to_lng),
    client_name: booking.client_name,
    client_phone: booking.client_phone,
    driver_id: booking.driver_id,
    driver_name: booking.driver_name,
    driver_phone: booking.driver_phone,
    amount_fcfa: amount,
    commission_fcfa: commission,
    driver_earning_fcfa: driverEarning,
    status: booking.status,
    payment_method:
      booking.payment_method ??
      mapApiPaymentMethod(
        readString(raw, "payment_method", "payment_method_code", "paymentMethod")
      ),
    created_at: booking.created_at,
    vehicle_id: vehicle.vehicle_id,
    vehicle_plate: vehicle.vehicle_plate,
    vehicle_label:
      formatApiVehicleLabel(vehicleRaw, vehicle.vehicle_plate) ??
      vehicle.vehicle_label,
    vehicle_icon_url: resolveVehicleMapIconUrl(
      readString(vehicleRaw ?? {}, "colorCode", "color_code", "color") ?? null
    ),
    driver_location: driverLocation,
    zone_name: readString(raw, "zone_name", "zoneName"),
    estimated_arrival_at: readString(
      raw,
      "estimated_arrival_at",
      "estimatedArrivalAt"
    ),
    timeline,
    payment_status: booking.payment_status,
    notes: booking.notes,
    category_code: booking.category_code,
    completed_at: readString(raw, "completed_at", "completedAt"),
    cancelled_at: readString(raw, "cancelled_at", "cancelledAt"),
  };
}

export function mapPartnerOrderDetailResponse(
  response: PartnerOrderDetailApiResponse & Record<string, unknown>
): PartnerTripDetail {
  if (response.order && typeof response.order === "object") {
    const order = response.order as Record<string, unknown>;
    if (isAdminOrderDetailPayload(order)) {
      return mapAdminOrderDetailToTripDetail(
        order as ApiAdminOrderDetailPayload
      ) as PartnerTripDetail;
    }
    if (order.id || order.pickup_address || order.pickup_latitude) {
      return mapFranchiseOrderToTripDetail({
        order,
      } as unknown as Parameters<typeof mapFranchiseOrderToTripDetail>[0]) as PartnerTripDetail;
    }
    return mapPartnerTripPayloadToTripDetail(order, response);
  }

  const raw =
    (response.trip as Record<string, unknown> | undefined) ??
    (response.id ? (response as Record<string, unknown>) : null);

  if (!raw?.id) {
    throw new Error("Commande introuvable.");
  }

  if (isAdminOrderDetailPayload(raw)) {
    return mapAdminOrderDetailToTripDetail(
      raw as ApiAdminOrderDetailPayload
    ) as PartnerTripDetail;
  }

  return mapPartnerTripPayloadToTripDetail(raw, response);
}
