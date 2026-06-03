import type { TripStatus } from "@/shared/types";

const TRIP_LABELS: Record<TripStatus, string> = {
  requested: "Demandée",
  matching: "Recherche",
  assigned: "Assignée",
  arrived: "Arrivée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

const TRIP_STYLES: Record<TripStatus, string> = {
  requested: "bg-canvas text-muted",
  matching: "bg-canvas text-foreground",
  assigned: "bg-teal/10 text-teal-dark",
  arrived: "bg-teal/10 text-teal-dark",
  in_progress: "bg-teal/15 text-teal-dark",
  completed: "bg-teal/20 text-teal-dark",
  cancelled: "bg-red-50 text-red-600",
};

interface StatusPillProps {
  status: TripStatus;
  pulse?: boolean;
}

export function StatusPill({ status, pulse }: StatusPillProps) {
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TRIP_STYLES[status]}`}
    >
      {pulse && status === "in_progress" && (
        <span className="absolute -left-0.5 h-2 w-2 animate-pulse-ring rounded-full bg-teal" />
      )}
      {TRIP_LABELS[status]}
    </span>
  );
}
