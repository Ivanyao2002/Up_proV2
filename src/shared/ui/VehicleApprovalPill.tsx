import type { VehicleApprovalStatus } from "@/shared/types";
import { Badge, type BadgeTone } from "./Badge";

const MAP: Record<VehicleApprovalStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Brouillon", tone: "neutral" },
  pending: { label: "En validation", tone: "warning" },
  approved: { label: "Approuvé", tone: "success" },
  rejected: { label: "Rejeté", tone: "danger" },
};

export function VehicleApprovalPill({ status }: { status: VehicleApprovalStatus }) {
  const { label, tone } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
