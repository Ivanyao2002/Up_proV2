import { formatFCFA } from "@/shared/lib/format";

interface PricingCalibrationHeroProps {
  countryCode: string;
  countryLabel: string;
  fromDatabase?: boolean;
  undercutPct: number;
  priceCap: number;
  bandCount: number;
  premiumPrime?: number;
  engineEnabled: boolean;
}

export function PricingCalibrationHero({
  countryCode,
  countryLabel,
  fromDatabase,
  undercutPct,
  priceCap,
  bandCount,
  premiumPrime,
  engineEnabled,
}: PricingCalibrationHeroProps) {
  const clientShare = Math.max(0, 100 - undercutPct);

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

      <div className="relative z-[1]">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Moteur de prix · {countryCode}
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              fromDatabase !== false
                ? "bg-teal/25 text-teal-100"
                : "bg-white/15 text-white/80"
            }`}
          >
            {fromDatabase !== false ? "Publié" : "Brouillon"}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              engineEnabled ? "bg-white/15 text-white/90" : "bg-amber-500/30 text-amber-100"
            }`}
          >
            {engineEnabled ? "Paliers actifs" : "Barème classique"}
          </span>
        </div>

        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
          {countryLabel}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
          Ajustez la parité client, les barèmes par distance et le surge. Les courses sont
          recalculées à chaque devis selon la distance, le trafic, la météo et la tension
          chauffeurs.
        </p>

        <p className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tabular-nums tracking-tight text-white">
          {clientShare}&nbsp;% de la parité
        </p>
        <p className="mt-1 text-sm text-white/60">
          Décote concurrentielle de {undercutPct}&nbsp;% appliquée après arrondi
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Plafond surge
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">
              ×{priceCap}
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">Anti-explosion heure de pointe</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Paliers distance
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">{bandCount}</p>
            <p className="mt-0.5 text-[11px] text-white/50">Hyper-local → inter-villes</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Prime Premium
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-teal/90">
              {premiumPrime != null ? formatFCFA(premiumPrime) : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">Palier inter-villes (indicatif)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
