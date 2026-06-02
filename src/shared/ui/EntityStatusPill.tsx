type EntityStatus = "active" | "pending" | "suspended";

const LABELS: Record<EntityStatus, string> = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
};

const STYLES: Record<EntityStatus, string> = {
  active: "bg-teal/15 text-teal-dark",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-600",
};

export function EntityStatusPill({ status }: { status: EntityStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
