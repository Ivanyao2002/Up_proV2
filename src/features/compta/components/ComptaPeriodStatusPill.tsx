function resolvePeriodStatus(status: string): { label: string; className: string } {
  const key = status.toLowerCase();
  if (key === "open") {
    return { label: "Ouverte", className: "bg-teal/15 text-teal-dark" };
  }
  if (key === "closed") {
    return { label: "Clôturée", className: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300" };
  }
  if (key === "locked") {
    return { label: "Verrouillée", className: "bg-navy/10 text-navy dark:text-slate-200" };
  }
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: "bg-canvas text-muted",
  };
}

export function formatPeriodType(type?: string): string {
  if (!type) return "—";
  const key = type.toLowerCase();
  if (key === "daily" || key === "day") return "Journalière";
  if (key === "monthly" || key === "month") return "Mensuelle";
  return type;
}

export function ComptaPeriodStatusPill({ status }: { status: string }) {
  const resolved = resolvePeriodStatus(status);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${resolved.className}`}
    >
      {resolved.label}
    </span>
  );
}
