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
  const trendUp = trendPct >= 0;

  return (
    <section className="hero-grain kpi-card--navy relative overflow-hidden rounded-hero bg-gradient-to-br from-[#243049] via-navy-hero to-navy p-8 text-white shadow-[0_4px_24px_rgba(47,61,102,0.35)] md:p-10">
      <div
        className="kpi-card__pattern kpi-card__pattern--rings absolute inset-0"
        aria-hidden
      />
      <div
        className="kpi-card__pattern kpi-card__pattern--mesh absolute inset-0 opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-teal/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-tl from-teal/20 to-transparent"
        aria-hidden
      />

      <div className="relative z-[1]">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {label}
        </p>
        <p className="mt-3 text-[clamp(2rem,5vw,3rem)] font-semibold tabular-nums tracking-tight text-white">
          {formatFCFA(amount)}
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              trendUp
                ? "bg-teal/25 text-white"
                : "bg-white/15 text-white/90"
            }`}
          >
            {formatPercent(trendPct)}
          </span>
          <span>vs hier</span>
        </p>
      </div>
    </section>
  );
}
