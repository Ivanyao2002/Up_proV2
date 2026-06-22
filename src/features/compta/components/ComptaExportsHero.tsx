interface ComptaExportsHeroProps {
  countryLabel?: string;
}

export function ComptaExportsHero({ countryLabel }: ComptaExportsHeroProps) {
  return (
    <section className="kpi-card kpi-card--deep-teal kpi-card__grain relative overflow-hidden rounded-hero p-6 text-white shadow-card md:p-8">
      <div className="kpi-card__pattern kpi-card__pattern--waves absolute inset-0 opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[1]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
          Centre d&apos;exports
          {countryLabel ? (
            <span className="normal-case tracking-normal text-white/45"> · {countryLabel}</span>
          ) : null}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Rapports et fichiers CSV
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
          Téléchargez le journal comptable et accédez aux exports locaux depuis les modules
          du portail — données limitées à votre périmètre pays.
        </p>
      </div>
    </section>
  );
}
