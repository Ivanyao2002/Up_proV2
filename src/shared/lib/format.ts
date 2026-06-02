export function formatFCFA(amount: number): string {
  return (
    new Intl.NumberFormat("fr-CI", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA"
  );
}

export function formatPercent(value: number, signed = true): string {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)} %`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}
