"use client";

import { PageHeader } from "@/shared/ui/PageHeader";

// Icônes SVG inline
const IconMapPin = () => <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;

export function PartnerFreightZonesPage() {
  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Zones & Couloirs"
        breadcrumb={["Partenaire", "Fret", "Zones"]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <div className="rounded-card border border-dashed border-border bg-surface p-10 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
              <IconMapPin />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Module en préparation</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              La gestion des zones de service et des couloirs de fret
              (origine → destination) sera disponible prochainement, dès la mise
              à disposition des endpoints dédiés côté backend.
            </p>
            <span className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              À venir
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h3 className="font-semibold mb-4">Informations</h3>
            <p className="text-sm text-muted mb-4">
              Les zones et couloirs permettront de définir les zones géographiques
              dans lesquelles vous opérez.
            </p>
            <ul className="text-sm space-y-2 text-muted">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Zone : zone de couverture géographique
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Couloir : route spécifique (origine-destination)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
