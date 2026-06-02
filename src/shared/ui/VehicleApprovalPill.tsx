import type { VehicleApprovalStatus } from "@/shared/types";

const LABELS: Record<VehicleApprovalStatus, string> = {
  draft: "Brouillon",
  pending: "En validation",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const STYLES: Record<VehicleApprovalStatus, string> = {
  draft: "bg-canvas text-muted border border-border",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-teal/15 text-teal-dark",
  rejected: "bg-red-50 text-red-600",
};

export function VehicleApprovalPill({ status }: { status: VehicleApprovalStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
