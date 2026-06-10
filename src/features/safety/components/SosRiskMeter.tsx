interface SosRiskMeterProps {
  score: number;
  compact?: boolean;
}

function riskTone(score: number): string {
  if (score >= 85) return "from-red-600 to-red-500";
  if (score >= 60) return "from-orange-500 to-amber-500";
  if (score >= 35) return "from-amber-400 to-yellow-400";
  return "from-teal to-teal-dark";
}

export function SosRiskMeter({ score, compact = false }: SosRiskMeterProps) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Score de risque
        </span>
        <span className="font-mono text-sm font-bold tabular-nums text-foreground">
          {clamped}
        </span>
      </div>
      <div
        className={`overflow-hidden rounded-full bg-navy/10 ${compact ? "h-1.5" : "h-2.5"}`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${riskTone(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
