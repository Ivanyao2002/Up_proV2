import Link from "next/link";
import { formatDateTime } from "@/shared/lib/format";
import type { TripMatchingOutcome } from "@/shared/types";

const OUTCOME_LABELS: Record<TripMatchingOutcome, string> = {
  declined: "Refusé",
  no_response: "Sans réponse",
  accepted: "Accepté",
};

const OUTCOME_CLASS: Record<TripMatchingOutcome, string> = {
  declined: "text-red-600 bg-red-50 border-red-200",
  no_response: "text-amber-800 bg-amber-50 border-amber-200",
  accepted: "text-teal-dark bg-teal/10 border-teal/25",
};

export interface TimelineMatchingDriverRow {
  driver_id: string | number;
  driver_name: string;
  outcome: TripMatchingOutcome;
  reason?: string;
  href: string;
}

export interface TimelineTripLink {
  id: string;
  ref: string;
  href: string;
  subtitle?: string;
}

export interface TimelineItem {
  id: string;
  label: string;
  description?: string;
  at: string;
  variant?: "default" | "success" | "warning" | "muted";
  matching_drivers?: TimelineMatchingDriverRow[];
  trip_link?: TimelineTripLink;
}

const DOT: Record<NonNullable<TimelineItem["variant"]>, string> = {
  default: "bg-navy",
  success: "bg-teal",
  warning: "bg-amber-400",
  muted: "bg-muted/50",
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-0">
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
          {i < items.length - 1 && (
            <span
              className="absolute left-[7px] top-4 h-full w-px bg-border"
              aria-hidden
            />
          )}
          <span
            className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow-sm ${DOT[item.variant ?? "default"]}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            {item.description && (
              <p className="mt-0.5 text-sm text-muted">{item.description}</p>
            )}

            {item.trip_link && (
              <div className="mt-2 rounded-lg border border-border bg-canvas/80 px-3 py-2">
                <Link
                  href={item.trip_link.href}
                  className="text-sm font-medium text-teal hover:underline"
                >
                  {item.trip_link.ref}
                </Link>
                {item.trip_link.subtitle && (
                  <p className="mt-0.5 text-xs text-muted">{item.trip_link.subtitle}</p>
                )}
              </div>
            )}

            {item.matching_drivers && item.matching_drivers.length > 0 && (
              <ul className="mt-2 space-y-1.5 rounded-lg border border-border bg-canvas/60 p-2">
                {item.matching_drivers.map((d) => (
                  <li
                    key={d.driver_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover"
                  >
                    <Link
                      href={d.href}
                      className="text-sm font-medium text-foreground hover:text-teal"
                    >
                      {d.driver_name}
                    </Link>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${OUTCOME_CLASS[d.outcome]}`}
                    >
                      {OUTCOME_LABELS[d.outcome]}
                    </span>
                    {d.reason && d.outcome !== "accepted" && (
                      <p className="w-full text-xs text-muted">{d.reason}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {item.at && (
              <time className="mt-1 block text-xs text-muted">
                {formatDateTime(item.at)}
              </time>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
