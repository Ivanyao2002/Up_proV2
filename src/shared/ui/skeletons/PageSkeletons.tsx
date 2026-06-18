"use client";

import {
  Bone,
  ChartFluxSkeleton,
  HeroKpiSkeleton,
  KPI_DARK_VARIANTS,
  KpiCardSkeleton,
  PageHeaderSkeleton,
  TableBlockSkeleton,
} from "./SkeletonPrimitives";

interface ShellProps {
  title?: string;
  breadcrumb?: string[];
  "aria-label"?: string;
}

/** Tableau de bord admin complet */
export function AdminDashboardSkeleton() {
  return (
    <div
      className="animate-fade-up"
      aria-busy="true"
      aria-label="Chargement du tableau de bord"
    >
      <PageHeaderSkeleton
        title="Tableau de bord"
        breadcrumb={["Admin", "Opérations"]}
        showAction
      />
      <div className="space-y-5">
        <HeroKpiSkeleton />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartFluxSkeleton />
          </div>
          <div className="flex flex-col gap-5">
            <KpiCardSkeleton variant="charcoal" compact />
            <KpiCardSkeleton variant="deep-teal" compact />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {KPI_DARK_VARIANTS.map((variant) => (
            <KpiCardSkeleton key={variant} variant={variant} />
          ))}
        </div>
        <TableBlockSkeleton />
      </div>
    </div>
  );
}

/** Dashboard franchise / partenaire (hero + KPI + 2 colonnes) */
export function PortalDashboardSkeleton({
  title = "Tableau de bord",
  breadcrumb,
}: ShellProps) {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-label={`Chargement de ${title}`}>
      <PageHeaderSkeleton title={title} breadcrumb={breadcrumb} />
      <div className="space-y-5">
        <HeroKpiSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_DARK_VARIANTS.map((variant) => (
            <KpiCardSkeleton key={variant} variant={variant} compact />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartFluxSkeleton />
          <TableBlockSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}

/** Finance admin */
export function FinanceDashboardSkeleton({ title = "Finance" }: { title?: string }) {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-label={`Chargement de ${title}`}>
      <PageHeaderSkeleton title={title} breadcrumb={["Admin", "Finance"]} />
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          {KPI_DARK_VARIANTS.map((variant) => (
            <KpiCardSkeleton key={variant} variant={variant} />
          ))}
        </div>
        <ChartFluxSkeleton />
        <TableBlockSkeleton />
      </div>
    </div>
  );
}

/** Fiche détail (chauffeur, franchise, partenaire, course…) */
export function DetailPageSkeleton({
  title = "Chargement…",
  breadcrumb,
  showSidebar = true,
  kpiCount = 4,
}: ShellProps & { showSidebar?: boolean; kpiCount?: number }) {
  return (
    <div className="animate-fade-up space-y-6" aria-busy="true" aria-label={`Chargement de ${title}`}>
      <div className="space-y-2">
        <PageHeaderSkeleton title={title} breadcrumb={breadcrumb} />
        <Bone className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_DARK_VARIANTS.slice(0, kpiCount).map((variant) => (
          <KpiCardSkeleton key={variant} variant={variant} compact />
        ))}
      </div>
      <div className={showSidebar ? "detail-page-grid" : ""}>
        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Bone key={i} className="h-9 w-28 rounded-full" />
            ))}
          </div>
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-card border border-border/60 p-4">
                  <Bone className="mb-3 h-32 w-full rounded-lg bg-navy/8" />
                  <Bone className="mb-2 h-4 w-3/4" />
                  <Bone className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {showSidebar && (
          <aside className="space-y-4">
            <KpiCardSkeleton variant="deep-teal" compact />
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <Bone className="mb-3 h-4 w-24" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <Bone className="h-3 w-20" />
                    <Bone className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/** Carte live (admin, franchise, partenaire, dispatch) */
export function MapPageSkeleton({
  showStatsBar = true,
  showSidePanel = true,
}: {
  showStatsBar?: boolean;
  showSidePanel?: boolean;
}) {
  return (
    <div
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      aria-busy="true"
      aria-label="Chargement de la carte"
    >
      <div className="space-y-3">
        {showStatsBar && (
          <div className="h-14 rounded-card border border-border bg-surface px-4 py-3 shadow-card">
            <div className="flex flex-wrap items-center gap-3">
              <Bone className="h-8 w-36 rounded-lg bg-navy/12" />
              <Bone className="h-8 w-28 rounded-lg" />
              <Bone className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {KPI_DARK_VARIANTS.map((variant) => (
            <KpiCardSkeleton key={variant} variant={variant} compact />
          ))}
        </div>
        <div className="relative h-[min(520px,70vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-navy/5 via-transparent to-teal/5" />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Bone className="h-8 w-8 rounded-lg bg-surface/80" />
            <Bone className="h-8 w-8 rounded-lg bg-surface/80" />
          </div>
        </div>
      </div>
      {showSidePanel && (
        <div className="flex h-[min(560px,72vh)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <div className="border-b border-border px-4 py-3">
            <Bone className="h-4 w-32" />
          </div>
          <div className="flex-1 space-y-0 divide-y divide-border/50 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Bone className="h-9 w-9 shrink-0 rounded-full bg-teal/15" />
                <div className="min-w-0 flex-1">
                  <Bone className="mb-1.5 h-3.5 w-28" />
                  <Bone className="h-3 w-20" />
                </div>
                <Bone className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Zone / territoire avec carte */
export function ZoneMapSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Chargement de la zone">
      <PageHeaderSkeleton title="Zone" breadcrumb={["Réseau", "Zones"]} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <Bone className="mb-4 h-4 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="relative h-[min(380px,50vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-navy/8 to-teal/5" />
        </div>
      </div>
    </div>
  );
}

/** Liste réseau (franchises, partenaires, tableaux) */
export function EntityListSkeleton({ title }: { title: string }) {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-label={`Chargement de ${title}`}>
      <PageHeaderSkeleton title={title} />
      <div className="mt-6 rounded-card border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
          <Bone className="h-9 w-64 rounded-lg bg-navy/12" />
          <Bone className="h-9 w-36 rounded-lg" />
        </div>
        <TableBlockSkeleton rows={8} />
      </div>
    </div>
  );
}

/** Bloc simple remplaçant l'ancien `h-64 bg-border` */
export function SimplePageSkeleton({ title }: { title?: string }) {
  return (
    <div className="animate-fade-up space-y-5" aria-busy="true">
      {title ? <PageHeaderSkeleton title={title} /> : null}
      <HeroKpiSkeleton />
      <div className="grid gap-5 md:grid-cols-3">
        {KPI_DARK_VARIANTS.map((v) => (
          <KpiCardSkeleton key={v} variant={v} compact />
        ))}
      </div>
    </div>
  );
}
