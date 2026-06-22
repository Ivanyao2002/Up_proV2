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
    href: "/reporting/activity",
    label: "Activité consolidée",
    description: "KPIs plateforme, franchises et services",
    icon: "trips",
  },
  {
    href: "/reporting/exports",
    label: "Rapports & exports",
    description: "CSV journal, synthèses mensuelles et exports modules",
    icon: "reports",
  },
  {
    href: "/admin/dashboard",
    label: "Dashboard opérationnel",
    description: "Vue globale courses, chauffeurs et alertes",
    icon: "dashboard",
  },
  {
    href: "/admin/finance",
    label: "Finance consolidée",
    description: "GMV, commissions, wallets — lecture seule",
    icon: "finance",
  },
];

export function ReportingDashboardPage() {
  return (
    <div className="animate-fade-up">
      <PageHeader title="Tableau de bord reporting" breadcrumb={["Reporting"]} />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Synthèses multi-services, exports financiers et indicateurs de performance pour la
        direction et le contrôle de gestion.
      </p>

      <div className="kpi-card mb-6 rounded-card border border-border bg-gradient-to-br from-navy to-navy/90 p-6 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Périmètre analyste reporting
        </p>
        <h2 className="mt-2 text-xl font-bold">Lecture &amp; export</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Consultation des tableaux consolidés et téléchargement des rapports — sans actions
          d&apos;exploitation ni validation financière.
        </p>
      </div>

      <div className="animate-stagger mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="GMV du jour" value="—" hint="Tous services" index={0} />
        <KpiCard label="Courses terminées" value="—" hint="24 h glissantes" index={1} />
        <KpiCard label="Exports disponibles" value="4+" hint="CSV serveur & local" index={2} />
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-heading">Accès rapides</h2>
          <p className="mt-0.5 text-xs text-muted">Modules du portail reporting</p>
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
