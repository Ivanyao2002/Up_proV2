import type {
  DispatchServiceKey,
  DispatchWaveScheduleEntry,
} from "../api/dispatchConfig.api.types";

interface DispatchCalibrationHeroProps {
  countryCode: string;
  countryLabel: string;
  service: DispatchServiceKey;
  serviceLabel: string;
  preset: string;
  maxRadiusKm: number;
  offerTtlSeconds: number;
  maxWaves: number;
  waveSchedule: DispatchWaveScheduleEntry[];
}

export function DispatchCalibrationHero({
  countryCode,
  countryLabel,
  service,
  serviceLabel,
  preset,
  maxRadiusKm,
  offerTtlSeconds,
  maxWaves,
  waveSchedule,
}: DispatchCalibrationHeroProps) {
  const wavesLabel = waveSchedule.map((w) => `V${w.wave} ${w.radiusKm} km`).join(" → ");

  return (
    <section className="hero-grain kpi-card--navy relative overflow-hidden rounded-hero bg-gradient-to-br from-[#243049] via-navy-hero to-navy p-8 text-white shadow-[0_4px_24px_rgba(47,61,102,0.35)] md:p-10">
      <div className="kpi-card__pattern kpi-card__pattern--rings absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-teal/30 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[1]">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Dispatcher · {countryCode} · {service}
          </p>
          <span className="rounded-full bg-teal/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-100">
            Preset {preset}
          </span>
        </div>

        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
          {countryLabel} — {serviceLabel}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
          Attribution des courses : vagues de recherche, score candidats et mode d&apos;offre.
          Les changements sont effectifs en moins d&apos;une minute.
        </p>

        <p className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tabular-nums tracking-tight text-white">
          {maxRadiusKm} km
        </p>
        <p className="mt-1 text-sm text-white/60">Rayon de la première vague</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Vagues
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">{maxWaves}</p>
            <p className="mt-0.5 text-[11px] text-white/50">{wavesLabel || "—"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Délai offre
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">
              {offerTtlSeconds}s
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">Temps pour accepter</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Timeout
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-teal/90">
              {waveSchedule.length > 0 ? `${waveSchedule.length} paliers` : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">Rayons planifiés</p>
          </div>
        </div>
      </div>
    </section>
  );
}
