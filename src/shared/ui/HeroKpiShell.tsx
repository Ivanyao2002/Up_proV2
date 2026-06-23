import type { ReactNode } from "react";

interface HeroKpiShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper visuel commun des KPI « hero » : gradient navy, grain,
 * patterns (rings + mesh), orbes lumineux, padding et ombre.
 * Le contenu est rendu dans une couche au-dessus des décorations.
 */
export function HeroKpiShell({ children, className = "" }: HeroKpiShellProps) {
  return (
    <section
      className={`hero-grain kpi-card--navy relative overflow-hidden rounded-hero bg-gradient-to-br from-[#243049] via-navy-hero to-navy p-8 text-white shadow-[0_4px_24px_rgba(47,61,102,0.35)] md:p-10 ${className}`}
    >
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

      <div className="relative z-[1]">{children}</div>
    </section>
  );
}
