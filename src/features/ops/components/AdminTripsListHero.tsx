import { formatPercent } from "@/shared/lib/format";

interface AdminTripsListHeroProps {
  filteredTotal: number;
  rangeLabel: string;
  tripsToday: number;
  trendPct?: number;
}

export function AdminTripsListHero({
  filteredTotal,
  rangeLabel,
  tripsToday,
  trendPct,
}: AdminTripsListHeroProps) {
  const trendUp = (trendPct ?? 0) >= 0;

  return (
    <section className="hero-grain kpi-card--navy relative overflow-hidden rounded-hero bg-gradient-to-br from-[#243049] via-navy-hero to-navy p-6 text-white shadow-[0_4px_24px_rgba(47,61,102,0.35)] md:p-8">
      <div className="kpi-card__pattern kpi-card__pattern--rings absolute inset-0" aria-hidden />
      <div
        className="kpi-card__pattern kpi-card__pattern--mesh absolute inset-0 opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-teal/30 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Opérations · Courses
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Suivi des courses
          </h2>
          <p className="mt-2 text-sm text-white/65">{rangeLabel}</p>
          {trendPct != null ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  trendUp ? "bg-teal/25 text-white" : "bg-white/15 text-white/90"
                }`}
              >
                {formatPercent(trendPct)}
              </span>
              <span>courses aujourd&apos;hui vs hier</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[5.5rem] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-semibold tabular-nums text-white">
              {filteredTotal.toLocaleString("fr-CI")}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Résultats
            </p>
          </div>
          <div className="min-w-[5.5rem] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-semibold tabular-nums text-white">
              {tripsToday.toLocaleString("fr-CI")}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Aujourd&apos;hui
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
