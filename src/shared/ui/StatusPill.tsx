import type { TripStatus } from "@/shared/types";
import { Badge, type BadgeTone } from "./Badge";

const MAP: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  requested: { label: "Demandée", tone: "neutral" },
  matching: { label: "Recherche", tone: "neutral" },
  assigned: { label: "Assignée", tone: "success" },
  arrived: { label: "Arrivée", tone: "success" },
  in_progress: { label: "En cours", tone: "success" },
  completed: { label: "Terminée", tone: "success" },
  cancelled: { label: "Annulée", tone: "danger" },
};

interface StatusPillProps {
  status: TripStatus;
  pulse?: boolean;
}

export function StatusPill({ status, pulse }: StatusPillProps) {
  const { label, tone } = MAP[status];
  return (
    <Badge tone={tone} className="relative">
      {pulse && status === "in_progress" && (
        <span className="absolute -left-0.5 h-2 w-2 animate-pulse-ring rounded-full bg-teal" />
      )}
      {label}
    </Badge>
  );
}
