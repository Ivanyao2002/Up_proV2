"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { NavIcon } from "@/portals/shared/NavIcon";
import { useSupportPaths } from "../lib/supportPaths";

const ANOMALY_MODULES = [
  {
    id: "audit",
    title: "Journal d'audit",
    description:
      "Historique inviolable des actions sensibles : connexions, validations KYC, modifications paramètres.",
    icon: "reports" as const,
    pathKey: "anomaliesAudit" as const,
  },
  {
    id: "forensic",
    title: "Forensic course GPS",
    description:
      "Analyse trajectoire et événements d'une course litigieuse — accessible depuis un ticket ou litige.",
    icon: "map" as const,
    externalHint: "Via fiche course ou litige",
  },
  {
    id: "tickets",
    title: "Tickets & litiges",
    description:
      "File des réclamations ouvertes — point d'entrée pour escalader une anomalie terrain.",
    icon: "support" as const,
    pathKey: "tickets" as const,
  },
] as const;

export function SupportAnomaliesPage() {
  const paths = useSupportPaths();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Centre anomalies"
        breadcrumb={["Support", "Anomalies"]}
      />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Registre de suivi des écarts recette et production : audit, forensic GPS et
        réclamations structurées.
      </p>

      <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>Rôle support :</strong> documenter chaque anomalie (ticket + note audit) avant
        escalade finance ou conformité.
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {ANOMALY_MODULES.map((item) => {
          const href =
            "pathKey" in item && item.pathKey
              ? paths[item.pathKey]
              : paths.tickets;

          return (
            <Link
              key={item.id}
              href={href}
              className="group flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-teal/35"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal-dark">
                <NavIcon name={item.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-heading group-hover:text-teal-dark">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted">{item.description}</p>
              {"externalHint" in item && item.externalHint ? (
                <p className="mt-4 text-xs font-medium text-muted">{item.externalHint}</p>
              ) : (
                <span className="mt-4 text-sm font-medium text-teal group-hover:underline">
                  Ouvrir →
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
