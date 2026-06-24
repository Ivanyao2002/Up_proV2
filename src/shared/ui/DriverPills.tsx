import type { Driver } from "@/shared/types";
import { Badge, type BadgeTone } from "./Badge";

const ACCOUNT_MAP: Record<Driver["account_status"], { label: string; tone: BadgeTone }> = {
  pending: { label: "En attente", tone: "warning" },
  approved: { label: "Approuvé", tone: "success" },
  suspended: { label: "Suspendu", tone: "danger" },
  banned: { label: "Banni", tone: "danger" },
};

const AVAIL_LABELS: Record<Driver["availability"], string> = {
  offline: "Hors ligne",
  online: "En ligne",
  on_trip: "En course",
  paused: "Pause",
};

export function AccountStatusPill({ status }: { status: Driver["account_status"] }) {
  const { label, tone } = ACCOUNT_MAP[status] ?? {
    label: "En attente",
    tone: "warning" as BadgeTone,
  };
  return <Badge tone={tone}>{label}</Badge>;
}

const AVAIL_DOT: Record<Driver["availability"], string> = {
  online: "bg-teal",
  on_trip: "bg-teal",
  offline: "bg-red-500",
  paused: "bg-amber-400",
};

export function AvailabilityPill({
  status,
  onDark = false,
}: {
  status: Driver["availability"];
  onDark?: boolean;
}) {
  const isOnline = status === "online" || status === "on_trip";
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 text-xs font-medium ${
        onDark ? "text-white/85" : "text-foreground"
      }`}
    >
      {isOnline ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-teal opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
        </span>
      ) : (
        <span className={`h-2 w-2 rounded-full ${AVAIL_DOT[status]}`} />
      )}
      {AVAIL_LABELS[status]}
    </span>
  );
}
