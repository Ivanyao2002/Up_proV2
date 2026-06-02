interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  className?: string;
}

export function KpiCard({ label, value, hint, trend, className = "" }: KpiCardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface p-6 shadow-card ${className}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#212529]">
        {value}
      </p>
      {(hint || trend) && (
        <p className="mt-2 text-sm text-muted">
          {trend && <span className="text-teal font-medium">{trend} </span>}
          {hint}
        </p>
      )}
    </div>
  );
}
