import type { TripService } from "@/shared/types";
import { getServiceLabel } from "@/shared/lib/tripLabels";

const STYLES: Record<TripService, string> = {
  taxi: "bg-navy/10 text-foreground",
  delivery: "bg-teal/15 text-teal-dark",
  rental: "bg-canvas text-muted border border-border",
  freight: "bg-amber-50 text-amber-800",
};

export function ServicePill({ service }: { service: TripService }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[service]}`}
    >
      {getServiceLabel(service)}
    </span>
  );
}
