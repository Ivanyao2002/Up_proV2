import type { Driver } from "@/shared/types";

const ACCOUNT_LABELS: Record<Driver["account_status"], string> = {
  pending: "En attente",
  approved: "Approuvé",
  suspended: "Suspendu",
  banned: "Banni",
};

const ACCOUNT_STYLES: Record<Driver["account_status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-teal/15 text-teal-dark",
  suspended: "bg-orange-50 text-orange-700",
  banned: "bg-red-50 text-red-600",
};

const AVAIL_LABELS: Record<Driver["availability"], string> = {
  offline: "Hors ligne",
  online: "En ligne",
  on_trip: "En course",
  paused: "Pause",
};

export function AccountStatusPill({ status }: { status: Driver["account_status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ACCOUNT_STYLES[status]}`}
    >
      {ACCOUNT_LABELS[status]}
    </span>
  );
}

export function AvailabilityPill({ status }: { status: Driver["availability"] }) {
  const isOnline = status === "online" || status === "on_trip";
  return (
    <span className="relative inline-flex items-center gap-1.5 text-xs font-medium text-[#212529]">
      {isOnline && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-teal opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
        </span>
      )}
      {!isOnline && <span className="h-2 w-2 rounded-full bg-muted/40" />}
      {AVAIL_LABELS[status]}
    </span>
  );
}
