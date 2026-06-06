import type { TripMatchingDriver, TripTimelineEvent } from "@/shared/types";
import type { TimelineItem } from "@/shared/ui/Timeline";

/** Ordre métier d'une course (plus petit = étape plus tôt). */
const TRIP_TIMELINE_TYPE_ORDER: Record<TripTimelineEvent["type"], number> = {
  requested: 10,
  matching: 20,
  assigned: 30,
  arrived: 40,
  in_progress: 50,
  completed: 60,
  cancelled: 70,
};

/** Du début à la fin de course ; priorité au cycle métier si les dates API sont incohérentes. */
export function sortTripTimelineChronological(
  events: TripTimelineEvent[]
): TripTimelineEvent[] {
  return [...events].sort((a, b) => {
    const orderA = TRIP_TIMELINE_TYPE_ORDER[a.type] ?? 99;
    const orderB = TRIP_TIMELINE_TYPE_ORDER[b.type] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(a.at).getTime() - new Date(b.at).getTime();
  });
}

/** Plus récent en haut, début de course en bas (lecture du bas vers le haut). */
export function sortTripTimelineDisplayOrder(
  events: TripTimelineEvent[]
): TripTimelineEvent[] {
  return sortTripTimelineChronological(events).reverse();
}

export function tripTimelineVariant(
  type: TripTimelineEvent["type"]
): TimelineItem["variant"] {
  if (type === "completed" || type === "in_progress") return "success";
  if (type === "cancelled") return "muted";
  if (type === "matching" || type === "requested") return "warning";
  return "default";
}

export function tripTimelineToItems(
  events: TripTimelineEvent[],
  options?: { driverLinkBase?: string }
): TimelineItem[] {
  const base = options?.driverLinkBase ?? "/admin/fleet/drivers";
  return sortTripTimelineDisplayOrder(events).map((e) => ({
    id: e.id,
    label: e.label,
    description: e.matching_drivers?.length ? undefined : e.description,
    at: e.at,
    variant: tripTimelineVariant(e.type),
    matching_drivers: e.matching_drivers?.map((d) => ({
      ...d,
      href: `${base}/${d.driver_id}`,
    })),
  }));
}

export type TimelineMatchingDriver = TripMatchingDriver & { href: string };
