export function formatFCFA(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "—";
  return (
    new Intl.NumberFormat("fr-CI", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA"
  );
}

export function formatPercent(value: number | null | undefined, signed = true): string {
  if (value == null) return "—";
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)} %`;
}

export function formatDateTime(
  iso: string | null | undefined,
  fallback = "—"
): string {
  const raw = iso?.trim();
  if (!raw) return fallback;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "short",
  }).format(d);
}

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  return `il y a ${Math.floor(diff / 3600)} h`;
}
