interface ComptaPeriodsHeroProps {
  countryLabel?: string;
  currentPeriodLabel?: string;
  currentPeriodStatus?: string;
  openCount: number;
  closedCount: number;
}

function formatPeriodStatus(status?: string): string | undefined {
  if (!status) return undefined;
  const key = status.toLowerCase();
  if (key === "open") return "Ouverte";
  if (key === "closed") return "Clôturée";
  if (key === "locked") return "Verrouillée";
  return status;
}

export function ComptaPeriodsHero({
  countryLabel,
  currentPeriodLabel,
  currentPeriodStatus,
  openCount,
  closedCount,
}: ComptaPeriodsHeroProps) {
  const statusLabel = formatPeriodStatus(currentPeriodStatus);

  return (
    <section className="kpi-card kpi-card--charcoal kpi-card__grain relative overflow-hidden rounded-hero p-6 text-white shadow-card md:p-8">
      <div className="kpi-card__pattern kpi-card__pattern--mesh absolute inset-0 opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/20 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Calendrier comptable
            {countryLabel ? (
              <span className="normal-case tracking-normal text-white/45"> · {countryLabel}</span>
            ) : null}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {currentPeriodLabel ?? "Période en cours"}
          </h2>
          {statusLabel ? (
            <p className="mt-1 text-sm text-teal/90">Statut : {statusLabel}</p>
          ) : (
            <p className="mt-1 text-sm text-white/55">
              Clôturez la journée ou le mois une fois les contrôles validés.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm min-w-[5.5rem]">
            <p className="text-2xl font-semibold tabular-nums text-white">{openCount}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Ouvertes
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm min-w-[5.5rem]">
            <p className="text-2xl font-semibold tabular-nums text-white">{closedCount}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Clôturées
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
