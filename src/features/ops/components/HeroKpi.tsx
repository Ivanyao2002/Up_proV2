import { formatFCFA, formatPercent } from "@/shared/lib/format";
import { HeroKpiShell } from "@/shared/ui/HeroKpiShell";

interface HeroKpiProps {
  amount?: number;
  value?: number;
  /** Affichage monétaire (défaut) ou nombre entier (ex. courses) */
  display?: "currency" | "number";
  trendPct?: number | null;
  label?: string;
}

export function HeroKpi({
  amount = 0,
  value,
  display = "currency",
  trendPct,
  label = "Bénéfice net aujourd'hui",
}: HeroKpiProps) {
  const trendUp = (trendPct ?? 0) >= 0;
  const main =
    display === "number"
      ? (value ?? 0).toLocaleString("fr-CI")
      : formatFCFA(amount);

  return (
    <HeroKpiShell>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
        {label}
      </p>
      <p className="mt-3 text-[clamp(2rem,5vw,3rem)] font-semibold tabular-nums tracking-tight text-white">
        {main}
      </p>
      {trendPct != null && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              trendUp ? "bg-teal/25 text-white" : "bg-white/15 text-white/90"
            }`}
          >
            {formatPercent(trendPct)}
          </span>
          <span>vs hier</span>
        </p>
      )}
    </HeroKpiShell>
  );
}
