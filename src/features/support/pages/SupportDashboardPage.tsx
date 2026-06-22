"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { NavIcon, type NavIconName } from "@/portals/shared/NavIcon";

const QUICK_ACCESS: {
  href: string;
  label: string;
  description: string;
  icon: NavIconName;
}[] = [
  {
    href: "/support/tickets",
    label: "Tickets",
    description: "Réclamations, litiges et suivi de résolution",
    icon: "support",
  },
  {
    href: "/support/chat",
    label: "Chat franchises",
    description: "Conversations en direct avec les franchises",
    icon: "chat",
  },
  {
    href: "/support/anomalies",
    label: "Centre anomalies",
    description: "Incidents, audit et forensic courses",
    icon: "crisis",
  },
  {
    href: "/support/anomalies/audit",
    label: "Journal d'audit",
    description: "Traçabilité des actions sensibles plateforme",
    icon: "reports",
  },
];

export function SupportDashboardPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tableau de bord support"
        breadcrumb={["Support"]}
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Traitez les réclamations, répondez aux franchises et surveillez les anomalies
        opérationnelles.
      </p>

      <section className="hero-grain kpi-card--midnight relative mb-6 overflow-hidden rounded-hero border border-white/[0.06] bg-gradient-to-br from-[#0c1018] via-[#141b28] to-[#1a2436] p-8 text-white shadow-[0_8px_32px_rgba(8,12,20,0.65)] md:p-10">
        <div
          className="kpi-card__pattern kpi-card__pattern--rings absolute inset-0 opacity-40"
          aria-hidden
        />
        <div
          className="kpi-card__pattern kpi-card__pattern--mesh absolute inset-0 opacity-30"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-0 h-36 w-36 rounded-full bg-black/40 blur-3xl"
          aria-hidden
        />

        <div className="relative z-[1]">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/55">
            Périmètre agent support
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-[1.65rem]">
            Réclamations &amp; conformité
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
            Accès dédié aux tickets, au chat franchises et au registre d&apos;anomalies —
            sans exposition des modules finance ou paramétrage.
          </p>
        </div>
      </section>

      <div className="animate-stagger mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Tickets ouverts" value="—" hint="Vue temps réel" index={0} />
        <KpiCard label="Conversations actives" value="—" hint="Chat franchises" index={1} />
        <KpiCard label="Anomalies du jour" value="—" hint="Audit & forensic" index={2} />
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-heading">Accès rapides</h2>
          <p className="mt-0.5 text-xs text-muted">Modules du portail support</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACCESS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/35 hover:shadow-lg"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal-dark transition-colors group-hover:bg-teal/15">
                <NavIcon name={item.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground group-hover:text-teal-dark">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
