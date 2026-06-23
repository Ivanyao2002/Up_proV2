"use client";

import { PageHeader } from "@/shared/ui/PageHeader";

// Icône SVG inline
const IconNavigation = () => <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>;

export function PartnerTrackingPage() {
  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Tracking GPS"
        breadcrumb={["Partenaire", "Tracking"]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <div className="rounded-card border border-dashed border-border bg-surface p-10 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
              <IconNavigation />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Module en préparation</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Le suivi GPS en temps réel de vos missions (fret &amp; location) sera
              disponible prochainement, dès la mise à disposition de l&apos;API de
              tracking flotte côté backend. En attendant, le suivi par course reste
              accessible depuis le détail de chaque course.
            </p>
            <span className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              À venir
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h3 className="font-semibold mb-4">Légende</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>En mouvement</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Arrêt prolongé</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Alerte (hors zone)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
