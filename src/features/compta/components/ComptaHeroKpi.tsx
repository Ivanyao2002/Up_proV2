import { formatFCFA } from "@/shared/lib/format";

interface ComptaHeroKpiProps {
  creditsTodayFcfa: number;
  debitsTodayFcfa: number;
  commissionsMonthFcfa: number;
  periodLabel?: string;
  periodStatus?: string;
  countryLabel?: string;
}

function formatPeriodStatus(status?: string): string | undefined {
  if (!status) return undefined;
  const key = status.toLowerCase();
  if (key === "open") return "Ouverte";
  if (key === "closed") return "Clôturée";
  if (key === "locked") return "Verrouillée";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ComptaHeroKpi({
  creditsTodayFcfa,
  debitsTodayFcfa,
  commissionsMonthFcfa,
  periodLabel,
  periodStatus,
  countryLabel,
}: ComptaHeroKpiProps) {
  const netToday = creditsTodayFcfa - debitsTodayFcfa;
  const periodStatusLabel = formatPeriodStatus(periodStatus);

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

      <div className="relative z-[1]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Synthèse du jour
              {countryLabel ? (
                <span className="normal-case tracking-normal text-white/55">
                  {" "}
                  · {countryLabel}
                </span>
              ) : null}
            </p>
            <p className="mt-3 text-[clamp(2rem,5vw,3rem)] font-semibold tabular-nums tracking-tight text-white">
              {netToday >= 0 ? "+" : "−"}
              {formatFCFA(Math.abs(netToday))}
            </p>
            <p className="mt-1 text-sm text-white/55">Mouvement net ledger</p>
          </div>
          {periodLabel ? (
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-right backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Période
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">{periodLabel}</p>
              {periodStatusLabel ? (
                <p className="mt-0.5 text-xs text-teal/90">{periodStatusLabel}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Entrées
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-teal/90">
              +{formatFCFA(creditsTodayFcfa)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Sorties
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white/90">
              −{formatFCFA(debitsTodayFcfa)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Commissions du mois
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">
              {formatFCFA(commissionsMonthFcfa)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
