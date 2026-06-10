import { SOS_STATUS_LABELS } from "../lib/sosLabels";
import type { SosIncidentStatus } from "../api/sos.types";

const STATUS_CLASS: Record<SosIncidentStatus, string> = {
  active: "bg-red-100 text-red-800 ring-red-200",
  escalated: "bg-orange-100 text-orange-900 ring-orange-200",
  acknowledged: "bg-amber-50 text-amber-800 ring-amber-200",
  resolved: "bg-teal/15 text-teal-dark ring-teal/25",
  cancelled: "bg-navy/10 text-muted ring-border",
};

interface SosStatusPillProps {
  status: SosIncidentStatus;
  pulse?: boolean;
}

export function SosStatusPill({ status, pulse = false }: SosStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_CLASS[status]}`}
    >
      {pulse && (status === "active" || status === "escalated") ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
        </span>
      ) : null}
      {SOS_STATUS_LABELS[status]}
    </span>
  );
}
