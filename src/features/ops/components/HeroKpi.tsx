import { formatFCFA, formatPercent } from "@/shared/lib/format";

interface HeroKpiProps {
  amount: number;
  trendPct: number;
  label?: string;
}

export function HeroKpi({
  amount,
  trendPct,
  label = "Bénéfice net aujourd'hui",
}: HeroKpiProps) {
  return (
    <section className="hero-grain relative overflow-hidden rounded-hero bg-gradient-to-br from-navy-hero to-navy p-8 text-white shadow-card md:p-10">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-teal/25 blur-3xl"
        aria-hidden
      />
      <p className="text-xs font-medium uppercase tracking-wider text-white/70">
        {label}
      </p>
      <p className="mt-3 text-[clamp(2rem,5vw,3rem)] font-semibold tabular-nums tracking-tight">
        {formatFCFA(amount)}
      </p>
      <p className="mt-3 text-sm text-white/80">
        <span className="font-medium text-teal">{formatPercent(trendPct)}</span>
        {" "}vs hier
      </p>
    </section>
  );
}
