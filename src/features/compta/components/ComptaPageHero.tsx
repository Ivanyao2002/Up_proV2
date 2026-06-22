interface ComptaPageHeroStat {
  value: string | number;
  label: string;
}

interface ComptaPageHeroProps {
  kicker: string;
  title: string;
  description?: string;
  countryLabel?: string;
  variant?: "teal" | "charcoal";
  stats?: ComptaPageHeroStat[];
}

export function ComptaPageHero({
  kicker,
  title,
  description,
  countryLabel,
  variant = "teal",
  stats,
}: ComptaPageHeroProps) {
  const variantClass =
    variant === "charcoal" ? "kpi-card--charcoal" : "kpi-card--deep-teal";
  const patternClass =
    variant === "charcoal" ? "kpi-card__pattern--mesh" : "kpi-card__pattern--waves";

  return (
    <section
      className={`kpi-card ${variantClass} kpi-card__grain relative overflow-hidden rounded-hero p-6 text-white shadow-card md:p-8`}
    >
      <div className={`kpi-card__pattern ${patternClass} absolute inset-0 opacity-70`} aria-hidden />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
            {kicker}
            {countryLabel ? (
              <span className="normal-case tracking-normal text-white/45"> · {countryLabel}</span>
            ) : null}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">{description}</p>
          ) : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-[5.5rem] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-semibold tabular-nums text-white">{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
