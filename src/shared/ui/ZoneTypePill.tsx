import type { Zone } from "@/shared/types";

const LABELS: Record<Zone["type"], string> = {
  standard: "Standard",
  surge: "Surge",
  airport: "Aéroport",
};

const STYLES: Record<Zone["type"], string> = {
  standard: "bg-canvas text-muted",
  surge: "bg-teal/15 text-teal-dark",
  airport: "bg-navy/10 text-foreground",
};

export function ZoneTypePill({ type }: { type: Zone["type"] }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[type]}`}>
      {LABELS[type]}
    </span>
  );
}
