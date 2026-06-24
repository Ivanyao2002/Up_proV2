import { Badge, type BadgeTone } from "./Badge";

type EntityStatus = "active" | "pending" | "suspended";

const MAP: Record<EntityStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Actif", tone: "success" },
  pending: { label: "En attente", tone: "warning" },
  suspended: { label: "Suspendu", tone: "danger" },
};

export function EntityStatusPill({ status }: { status: EntityStatus }) {
  const { label, tone } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
