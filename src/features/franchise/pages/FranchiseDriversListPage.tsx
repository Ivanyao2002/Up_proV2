"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import {
  getDriverAccountStatusLabel,
  getDriverAvailabilityLabel,
} from "@/shared/lib/driverLabels";
import {
  DRIVER_COMPLIANCE_FILTER_OPTIONS,
  getDriverComplianceLabel,
  getDriverComplianceStyle,
} from "@/shared/lib/complianceLabels";
import type { DriverComplianceStatus } from "@/shared/types";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Driver, KycQueueItem } from "@/shared/types";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import {
  useFranchiseDriversList,
  useFranchiseKycQueue,
  useBulkDriverAvailability,
  useBulkSuspendDrivers,
  useBulkActivateDrivers,
} from "../api/drivers.queries";
import { BulkActionBar } from "@/shared/ui/BulkActionBar";

const ZONE_OPTIONS = [
  { value: "all" as const, label: "Toutes les zones" },
  { value: "Cocody", label: "Cocody" },
  { value: "Yopougon", label: "Yopougon" },
  { value: "Plateau", label: "Plateau" },
  { value: "Marcory", label: "Marcory" },
  { value: "Treichville", label: "Treichville" },
  { value: "Adjamé", label: "Adjamé" },
];

const ACCOUNT_OPTIONS = [
  { value: "all" as const, label: "Tous les comptes" },
  { value: "approved", label: "Approuvé" },
  { value: "pending", label: "En attente" },
  { value: "suspended", label: "Suspendu" },
];

const AVAILABILITY_OPTIONS = [
  { value: "all" as const, label: "Toutes dispo." },
  { value: "online", label: "En ligne" },
  { value: "offline", label: "Hors ligne" },
  { value: "on_trip", label: "En course" },
  { value: "paused", label: "Pause" },
];

const COMPLIANCE_LABELS: Record<string, string> = {
  no_vehicle: "Sans véhicule",
  docs_missing: "Docs manquants",
  docs_pending: "En attente review",
  docs_rejected: "Docs rejetés",
  complete: "Complet",
};

const COMPLIANCE_COLORS: Record<string, string> = {
  no_vehicle: "bg-gray-100 text-gray-600",
  docs_missing: "bg-red-100 text-red-700",
  docs_pending: "bg-amber-100 text-amber-700",
  docs_rejected: "bg-red-100 text-red-700",
  complete: "bg-teal/10 text-teal",
};

function KycDetailPanel({ item, onClose }: { item: KycQueueItem; onClose: () => void }) {
  const ds = item.driver?.documentsSummary;
  const vs = item.driver?.vehicleSummary;
  const compliance = item.compliance_status ?? item.driver?.complianceStatus ?? null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
        <div className="w-full max-w-md rounded-card border border-border bg-surface shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {item.first_name} {item.last_name}
              </h2>
              <p className="text-xs text-muted">{item.phone}{item.email ? ` · ${item.email}` : ""}</p>
            </div>
            <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-6 py-5 max-h-[70vh]">
            {/* Infos générales */}
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Informations</h3>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Partenaire</dt>
                  <dd className="text-foreground">{item.owner_name || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Zone</dt>
                  <dd className="text-foreground">{item.zone || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Catégorie</dt>
                  <dd className="text-foreground">{item.ride_category_code ?? item.driver?.ride_category_code ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Statut KYC</dt>
                  <dd className="font-medium text-foreground">{item.kyc_status ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Courses</dt>
                  <dd className="text-foreground">{item.trips_count ?? item.driver?.trips_count ?? 0}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Note</dt>
                  <dd className="text-foreground">{item.driver?.rating_avg != null ? `${item.driver.rating_avg} / 5` : "—"}</dd>
                </div>
                {compliance && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Conformité</dt>
                    <dd>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COMPLIANCE_COLORS[compliance] ?? "bg-gray-100 text-gray-600"}`}>
                        {COMPLIANCE_LABELS[compliance] ?? compliance}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Documents */}
            {ds && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Documents</h3>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-border bg-canvas py-2">
                    <p className="text-lg font-bold text-teal">{ds.approvedCount}</p>
                    <p className="text-muted">Approuvés</p>
                  </div>
                  <div className="rounded-lg border border-border bg-canvas py-2">
                    <p className="text-lg font-bold text-amber-500">{ds.pendingCount}</p>
                    <p className="text-muted">En attente</p>
                  </div>
                  <div className="rounded-lg border border-border bg-canvas py-2">
                    <p className="text-lg font-bold text-red-500">{ds.rejectedCount}</p>
                    <p className="text-muted">Rejetés</p>
                  </div>
                </div>
                {ds.missingTypes.length > 0 && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <p className="mb-1 text-xs font-medium text-red-700">Manquants ({ds.missingCount})</p>
                    <div className="flex flex-wrap gap-1">
                      {ds.missingTypes.map((t) => (
                        <span key={t} className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{t.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Véhicule */}
            {vs && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Véhicule</h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Véhicule assigné</dt>
                    <dd className={`font-medium ${vs.hasVehicle ? "text-teal" : "text-red-600"}`}>{vs.hasVehicle ? "Oui" : "Non"}</dd>
                  </div>
                  {vs.hasVehicle && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Docs véhicule</dt>
                      <dd className={`font-medium ${vs.vehicleDocumentsComplete ? "text-teal" : "text-amber-600"}`}>
                        {vs.vehicleDocumentsComplete ? "Complets" : "Incomplets"}
                      </dd>
                    </div>
                  )}
                  {vs.missingVehicleDocTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {vs.missingVehicleDocTypes.map((t) => (
                        <span key={t} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">{t.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  )}
                </dl>
              </section>
            )}

            {/* Actions */}
            <div className="pt-1">
              <Link
                href={`/franchise/drivers/${item.driver_id}`}
                className="block w-full rounded-lg bg-teal px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal/90"
              >
                Ouvrir la fiche complète →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

function ModerationView() {
  const [selected, setSelected] = useState<KycQueueItem | null>(null);
  const table = useServerTableState();
  const { data, isLoading, isError } = useFranchiseKycQueue(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<KycQueueItem>[] = [
    {
      id: "driver",
      header: "Chauffeur",
      cell: (item) => (
        <div>
          <Link href={`/franchise/drivers/${item.driver_id}`} className="font-medium text-foreground hover:text-teal">
            {item.first_name} {item.last_name}
          </Link>
          <p className="text-xs text-muted">{item.phone}</p>
          {item.email && <p className="text-xs text-muted">{item.email}</p>}
        </div>
      ),
      exportValue: (item) => `${item.first_name} ${item.last_name}`,
    },
    {
      id: "partner_zone",
      header: "Partenaire / Zone",
      cell: (item) => (
        <div>
          <p className="text-sm text-foreground">{item.owner_name || "—"}</p>
          <p className="text-xs text-muted">{item.zone || "—"}</p>
        </div>
      ),
      exportValue: (item) => `${item.owner_name} / ${item.zone}`,
    },
    {
      id: "category",
      header: "Catégorie",
      cell: (item) => (
        <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
          {item.ride_category_code ?? item.driver?.ride_category_code ?? "—"}
        </span>
      ),
      exportValue: (item) => item.ride_category_code ?? "",
    },
    {
      id: "documents",
      header: "Documents",
      cell: (item) => {
        const ds = item.driver?.documentsSummary;
        if (!ds) {
          return (
            <div className="space-y-0.5">
              <p className="text-xs"><span className="font-medium text-amber-600">{item.documents_pending}</span> en attente</p>
              <p className="text-xs"><span className="font-medium text-red-600">{item.documents_rejected}</span> rejetés</p>
            </div>
          );
        }
        return (
          <div className="space-y-0.5 text-xs">
            <p><span className="font-medium text-teal">{ds.approvedCount}/{ds.requiredCount}</span> approuvés</p>
            {ds.pendingCount > 0 && <p><span className="font-medium text-amber-600">{ds.pendingCount}</span> en attente</p>}
            {ds.rejectedCount > 0 && <p><span className="font-medium text-red-600">{ds.rejectedCount}</span> rejetés</p>}
            {ds.missingCount > 0 && <p><span className="font-medium text-red-500">{ds.missingCount}</span> manquants</p>}
          </div>
        );
      },
      exportValue: (item) => `${item.documents_pending} en attente, ${item.documents_rejected} rejetés`,
    },
    {
      id: "compliance",
      header: "Conformité",
      cell: (item) => {
        const c = item.compliance_status ?? item.driver?.complianceStatus ?? null;
        if (!c) return <span className="text-muted text-xs">—</span>;
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COMPLIANCE_COLORS[c] ?? "bg-gray-100 text-gray-600"}`}>
            {COMPLIANCE_LABELS[c] ?? c}
          </span>
        );
      },
      exportValue: (item) => item.compliance_status ?? "",
    },
    {
      id: "actions",
      header: "",
      cell: (item) => (
        <button
          type="button"
          onClick={() => setSelected(item)}
          className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-surface hover:text-teal transition-colors"
        >
          Voir plus
        </button>
      ),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger la file KYC.</p>;
  }

  return (
    <div className="animate-fade-up">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader title="Modération KYC" breadcrumb={["Franchise", "Flotte"]} />
        {meta && (
          <p className="mt-1 text-sm text-muted">
            {meta.total} dossier{meta.total > 1 ? "s" : ""} en attente
          </p>
        )}
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, téléphone, partenaire…"
        hasActiveFilters={!!table.search}
        onReset={() => table.setSearch("")}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(item) => String(item.driver_id)}
        isLoading={isLoading}
        exportFileName="moderation-kyc-franchise"
        emptyTitle="Aucun dossier en attente"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />

      {selected && <KycDetailPanel item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

interface FranchiseDriversListPageProps {
  pendingOnly?: boolean;
}

export function FranchiseDriversListPage({ pendingOnly }: FranchiseDriversListPageProps) {
  if (pendingOnly) return <ModerationView />;
  return <DriversListView />;
}

function DriversListView() {
  const [zoneFilter, setZoneFilter] = useState<(typeof ZONE_OPTIONS)[number]["value"]>("all");
  const [accountFilter, setAccountFilter] =
    useState<(typeof ACCOUNT_OPTIONS)[number]["value"]>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<(typeof AVAILABILITY_OPTIONS)[number]["value"]>("all");
  const [complianceFilter, setComplianceFilter] = useState<
    (typeof DRIVER_COMPLIANCE_FILTER_OPTIONS)[number]["value"]
  >("all");
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const table = useServerTableState(
    [zoneFilter, accountFilter, availabilityFilter, complianceFilter],
    {
      zone: zoneFilter !== "all" ? zoneFilter : undefined,
      account_status: accountFilter !== "all" ? accountFilter : undefined,
      availability: availabilityFilter !== "all" ? availabilityFilter : undefined,
      compliance_status:
        complianceFilter !== "all"
          ? (complianceFilter as DriverComplianceStatus)
          : undefined,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: zoneFilter, defaultValue: "all", reset: () => setZoneFilter("all") },
      { value: accountFilter, defaultValue: "all" as const, reset: () => setAccountFilter("all") },
      { value: availabilityFilter, defaultValue: "all", reset: () => setAvailabilityFilter("all") },
      { value: complianceFilter, defaultValue: "all", reset: () => setComplianceFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useFranchiseDriversList(table.listParams);
  const bulkOnline = useBulkDriverAvailability();
  const bulkOffline = useBulkDriverAvailability();
  const bulkSuspend = useBulkSuspendDrivers();
  const bulkActivate = useBulkActivateDrivers();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const selectedIds = Array.from(selected);
  const selectedRows = rows.filter((d) => selected.has(d.id));
  const hasSuspendedSelected = selectedRows.some((d) => d.account_status === "suspended");
  const hasApprovedSelected = selectedRows.some((d) => d.account_status === "approved");
  const bulkBusy = bulkOnline.isPending || bulkOffline.isPending || bulkSuspend.isPending || bulkActivate.isPending;

  const clearSelection = () => setSelected(new Set());
  const bulkPayload = { drivers: rows, ids: selectedIds };
  const bulkOpts = { onSuccess: () => clearSelection() };

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div>
          <Link
            href={`/franchise/drivers/${d.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {d.first_name} {d.last_name}
          </Link>
          <p className="text-xs text-muted">{d.phone}</p>
        </div>
      ),
      exportValue: (d) => `${d.first_name} ${d.last_name} (${d.phone})`,
    },
    {
      id: "owner",
      header: "Partenaire",
      cell: (d) => d.owner_name ?? "—",
      exportValue: (d) => d.owner_name ?? "",
    },
    {
      id: "zone",
      header: "Zone",
      cell: (d) => d.zone,
      exportValue: (d) => d.zone,
    },
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (d) => <span className="text-muted">{d.vehicle_label ?? "—"}</span>,
      exportValue: (d) => d.vehicle_label ?? "",
    },
    {
      id: "rating",
      header: "Note",
      className: "tabular-nums",
      cell: (d) => (d.rating > 0 ? d.rating.toFixed(2) : "—"),
      exportValue: (d) => (d.rating > 0 ? d.rating : ""),
    },
    {
      id: "documents",
      header: "Documents",
      cell: (d) => {
        const summary = d.documents_summary;
        if (!summary) return <span className="text-muted">—</span>;
        return (
          <span className="text-sm tabular-nums">
            {summary.approved_count}/{summary.required_count}
            {summary.missing_count > 0 ? (
              <span className="ml-1 text-amber-700">({summary.missing_count} manq.)</span>
            ) : null}
          </span>
        );
      },
      exportValue: (d) => {
        const summary = d.documents_summary;
        if (!summary) return "";
        return `${summary.approved_count}/${summary.required_count}`;
      },
    },
    {
      id: "compliance",
      header: "Conformité",
      cell: (d) =>
        d.compliance_status ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getDriverComplianceStyle(d.compliance_status)}`}
          >
            {getDriverComplianceLabel(d.compliance_status)}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
      exportValue: (d) =>
        d.compliance_status ? getDriverComplianceLabel(d.compliance_status) : "",
    },
    {
      id: "account",
      header: "Compte",
      cell: (d) => <AccountStatusPill status={d.account_status} />,
      exportValue: (d) => getDriverAccountStatusLabel(d.account_status),
    },
    {
      id: "availability",
      header: "Disponibilité",
      cell: (d) => <AvailabilityPill status={d.availability} />,
      exportValue: (d) => getDriverAvailabilityLabel(d.availability),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les chauffeurs.{" "}
        <Link href="/franchise/drivers" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Chauffeurs du territoire"
          breadcrumb={["Franchise", "Flotte"]}
        />
        {meta && (
          <p className="mt-1 text-sm text-muted">
            {meta.total} chauffeur{meta.total > 1 ? "s" : ""} sur le territoire
          </p>
        )}
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, téléphone, partenaire…"
        totalLabel={
          meta
            ? `${meta.total} chauffeur${meta.total > 1 ? "s" : ""} sur le territoire`
            : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <div className="flex flex-wrap items-end gap-3">
          <SelectFilter label="Zone" value={zoneFilter} onChange={setZoneFilter} options={ZONE_OPTIONS} />
          <SelectFilter label="Compte" value={accountFilter} onChange={setAccountFilter} options={ACCOUNT_OPTIONS} />
          <SelectFilter label="Disponibilité" value={availabilityFilter} onChange={setAvailabilityFilter} options={AVAILABILITY_OPTIONS} />
          <SelectFilter label="Conformité" value={complianceFilter} onChange={setComplianceFilter} options={DRIVER_COMPLIANCE_FILTER_OPTIONS} />
        </div>
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName="chauffeurs-franchise"
        emptyTitle="Aucun chauffeur"
        pagination={false}
        selectable
        selectedKeys={selected}
        onSelectionChange={setSelected}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />

      <BulkActionBar
        count={selected.size}
        onClear={clearSelection}
        actions={[
          ...(hasApprovedSelected
            ? [
                {
                  label: "Mettre en ligne",
                  disabled: bulkBusy,
                  onClick: () =>
                    bulkOnline.mutate(
                      { ...bulkPayload, availability: "online" },
                      bulkOpts
                    ),
                },
                {
                  label: "Hors ligne",
                  variant: "secondary" as const,
                  disabled: bulkBusy,
                  onClick: () =>
                    bulkOffline.mutate(
                      { ...bulkPayload, availability: "offline" },
                      bulkOpts
                    ),
                },
                {
                  label: "Suspendre",
                  variant: "secondary" as const,
                  disabled: bulkBusy,
                  onClick: () => bulkSuspend.mutate(bulkPayload, bulkOpts),
                },
              ]
            : []),
          ...(hasSuspendedSelected
            ? [
                {
                  label: "Réactiver",
                  disabled: bulkBusy,
                  onClick: () => bulkActivate.mutate(bulkPayload, bulkOpts),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
