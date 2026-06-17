"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { NavIcon, type NavIconName } from "@/portals/shared/NavIcon";
import { ComptaPageHero } from "./ComptaPageHero";
import { useComptaMe } from "../api/comptaPortal.queries";

export function ComptaPendingApiPage({
  title,
  breadcrumb,
  description,
  icon,
  kicker,
  alternatives,
  embedded = false,
}: {
  title: string;
  breadcrumb: string[];
  description: string;
  icon: NavIconName;
  kicker?: string;
  alternatives?: { label: string; href: string; icon: NavIconName }[];
  embedded?: boolean;
}) {
  const { data: me } = useComptaMe();

  const countryLabel =
    me?.accountant?.country?.name ??
    me?.country?.name ??
    (me?.admin ? "Tous pays" : undefined);

  const content = (
    <div className={embedded ? undefined : "animate-stagger space-y-6"}>
      <ComptaPageHero
        kicker={kicker ?? title}
        title="Module en préparation"
        description={description}
        countryLabel={countryLabel}
        variant="charcoal"
      />

      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal-dark">
            <NavIcon name={icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-heading">Bientôt disponible dans votre portail</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Ce module sera accessible directement depuis votre espace comptable, limité à votre
              périmètre pays. En attendant, consultez les modules déjà disponibles ci-dessous.
            </p>
          </div>
        </div>
      </div>

      {alternatives && alternatives.length > 0 ? (
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-heading">En attendant</h2>
            <p className="mt-0.5 text-xs text-muted">Modules disponibles pour le même besoin</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {alternatives.map((alt) => (
              <Link
                key={alt.href}
                href={alt.href}
                className="group flex gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/35"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal-dark">
                  <NavIcon name={alt.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground group-hover:text-teal-dark">
                    {alt.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-teal group-hover:underline">
                    Ouvrir →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Aucune alternative pour le moment"
          description="Revenez sur le tableau de bord pour suivre l'avancement des modules comptables."
          actionLabel="Tableau de bord"
          onAction={() => {
            window.location.href = "/compta";
          }}
        />
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title={title} breadcrumb={breadcrumb} />
      <p className="-mt-2 mb-6 text-sm text-muted">{description}</p>
      {content}
    </div>
  );
}
