"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { FilterChips } from "@/shared/ui/FilterChips";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { formatFCFA, formatDate } from "@/shared/lib/format";
import { notificationService } from "@/core/http/notificationService";
import {
  usePartnerRentalOffers,
  usePartnerRentalStats,
  useUpdateRentalOffer,
  useCreateRentalOffer,
} from "../api/rental.queries";
import type { RentalOffer, CreateRentalOfferPayload } from "../api/rental.service";
import {
  RENTAL_STATUS_CONFIG,
  rentalNextActions,
  type RentalStatus,
} from "../lib/rentalStatus";
import { RentalRejectModal } from "../components/RentalRejectModal";

const STATUS_FILTERS: { value: RentalStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "awaiting_confirmation", label: "À confirmer" },
  { value: "confirmed", label: "Confirmées" },
  { value: "ready", label: "Prêtes" },
  { value: "active", label: "En cours" },
  { value: "to_close", label: "À clôturer" },
  { value: "completed", label: "Clôturées" },
  { value: "cancelled", label: "Annulées" },
];

function StatusBadge({ status }: { status: RentalStatus }) {
  const cfg = RENTAL_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

export function PartnerRentalPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "all">("all");

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = usePartnerRentalOffers(table.listParams);
  const { data: stats } = usePartnerRentalStats();

  const rows = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  const kpi = useMemo(() => {
    const c = stats?.counters;
    return {
      total: c?.total ?? meta?.total ?? rows.length,
      toConfirm: c?.awaiting_confirmation ?? rows.filter((o) => o.status === "awaiting_confirmation").length,
      active: c?.active ?? rows.filter((o) => o.status === "active").length,
      revenue: stats?.revenue_fcfa,
    };
  }, [stats, meta, rows]);

  const columns: Column<RentalOffer>[] = [
    {
      id: "ref",
      header: "Référence",
      sortField: "ref",
      className: "min-w-[130px]",
      cell: (o) => (
        <Link
          href={`/partner/rental/${o.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {o.ref}
        </Link>
      ),
      exportValue: (o) => o.ref,
    },
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (o) => o.vehicle_label ?? o.vehicle_plate ?? "—",
      exportValue: (o) => o.vehicle_label ?? "",
    },
    {
      id: "client",
      header: "Client",
      sortField: "client_name",
      cell: (o) => (
        <div>
          <p className="text-sm">{o.client_name || "—"}</p>
          {o.client_phone && <p className="text-xs text-muted">{o.client_phone}</p>}
        </div>
      ),
      exportValue: (o) => o.client_name || "",
    },
    {
      id: "period",
      header: "Période",
      sortField: "pickup_date",
      cell: (o) => (
        <span className="text-sm whitespace-nowrap">
          {formatDate(o.pickup_date)} → {formatDate(o.return_date)}
        </span>
      ),
      exportValue: (o) => `${formatDate(o.pickup_date)} → ${formatDate(o.return_date)}`,
    },
    {
      id: "price",
      header: "Prix",
      sortField: "price_fcfa",
      cell: (o) => (
        <div>
          <div className="font-medium text-teal">{formatFCFA(o.price_fcfa)}</div>
          {o.deposit_fcfa ? (
            <div className="text-xs text-muted">Caution {formatFCFA(o.deposit_fcfa)}</div>
          ) : null}
        </div>
      ),
      exportValue: (o) => String(o.price_fcfa),
    },
    {
      id: "status",
      header: "Statut",
      sortField: "status",
      cell: (o) => <StatusBadge status={o.status} />,
      exportValue: (o) => RENTAL_STATUS_CONFIG[o.status].label,
    },
    {
      id: "actions",
      header: "",
      cell: (o) => <RentalQuickActions offer={o} />,
    },
  ];

  if (isError) {
    return <p className="p-6 text-sm text-red-600">Impossible de charger les réservations.</p>;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Réservations Location"
        breadcrumb={["Partenaire", "Location"]}
        actions={<Button onClick={() => setShowCreate(true)}>Nouvelle réservation</Button>}
      />

      <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <KpiCard index={0} label="Total" value={String(kpi.total)} isLoading={isLoading} />
        <KpiCard index={1} label="À confirmer" value={String(kpi.toConfirm)} isLoading={isLoading} />
        <KpiCard index={2} label="En cours" value={String(kpi.active)} isLoading={isLoading} />
        <KpiCard
          index={3}
          label="Revenus"
          value={kpi.revenue != null ? formatFCFA(kpi.revenue) : "—"}
          isLoading={isLoading}
        />
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Référence, client, véhicule..."
        totalLabel={meta ? `${meta.total} réservation${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetAll}
        emptyTitle="Aucune réservation"
        emptyDescription="Les demandes de location apparaîtront ici"
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize,
          {
            sortBy: table.sortBy,
            sortOrder: table.sortOrder,
            onSortChange: table.setSort,
          }
        )}
      />

      {showCreate && (
        <RentalCreateModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function RentalQuickActions({ offer }: { offer: RentalOffer }) {
  const update = useUpdateRentalOffer();
  const [confirmStatus, setConfirmStatus] = useState<{ to: RentalStatus; label: string } | null>(
    null
  );
  const [rejectVariant, setRejectVariant] = useState<"reject" | "cancel" | null>(null);

  // En triage on n'affiche que les actions « simples » ; le check-in/out se fait
  // depuis la fiche (états des lieux — Lot 4).
  const actions = rentalNextActions(offer.status).filter(
    (a) => a.kind !== "check_in" && a.kind !== "check_out"
  );
  if (actions.length === 0) {
    return (
      <Link href={`/partner/rental/${offer.id}`} className="text-xs text-teal hover:underline">
        Gérer
      </Link>
    );
  }

  const applyStatus = (to: RentalStatus, reason?: string) =>
    update.mutate(
      {
        id: offer.id,
        data: reason
          ? { status: to, rejection_reason: reason, cancellation_reason: reason }
          : { status: to },
      },
      {
        onSuccess: () => notificationService.success("Réservation mise à jour"),
        onError: () => notificationService.error("Action impossible."),
      }
    );

  return (
    <div className="flex items-center gap-1.5">
      {actions.map((a) =>
        a.requiresReason ? (
          <Button
            key={a.kind}
            variant="secondary"
            className="px-2.5 py-1 text-xs text-red-600"
            onClick={() => setRejectVariant(a.kind === "reject" ? "reject" : "cancel")}
          >
            {a.label}
          </Button>
        ) : (
          <Button
            key={a.kind}
            variant={a.variant === "primary" ? "primary" : "secondary"}
            className="px-2.5 py-1 text-xs"
            onClick={() => setConfirmStatus({ to: a.to, label: a.label })}
          >
            {a.label}
          </Button>
        )
      )}

      {confirmStatus && (
        <ConfirmModal
          open
          title={`${confirmStatus.label} la réservation`}
          message={`Confirmer l'action « ${confirmStatus.label} » sur ${offer.ref} ?`}
          confirmLabel={confirmStatus.label}
          cancelLabel="Annuler"
          onConfirm={() => {
            applyStatus(confirmStatus.to);
            setConfirmStatus(null);
          }}
          onCancel={() => setConfirmStatus(null)}
        />
      )}

      {rejectVariant && (
        <RentalRejectModal
          offerRef={offer.ref}
          variant={rejectVariant}
          isPending={update.isPending}
          onConfirm={(reason) => {
            applyStatus("cancelled", reason);
            setRejectVariant(null);
          }}
          onClose={() => setRejectVariant(null)}
        />
      )}
    </div>
  );
}

function RentalCreateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const create = useCreateRentalOffer();
  const [form, setForm] = useState<CreateRentalOfferPayload>({
    client_name: "",
    client_phone: "",
    pickup_location: "",
    return_location: "",
    pickup_date: "",
    return_date: "",
    price_fcfa: 0,
    deposit_fcfa: 0,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => {
        notificationService.success("Réservation créée");
        onSuccess();
      },
      onError: () => notificationService.error("Création impossible."),
    });
  };

  const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Nouvelle réservation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Nom du client *</label>
                <input
                  required
                  className={inputClass}
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Téléphone client</label>
                <input
                  className={inputClass}
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Prise en charge *</label>
                <input
                  required
                  type="datetime-local"
                  className={inputClass}
                  value={form.pickup_date}
                  onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Retour *</label>
                <input
                  required
                  type="datetime-local"
                  className={inputClass}
                  value={form.return_date}
                  onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Lieu de prise en charge *</label>
                <input
                  required
                  className={inputClass}
                  value={form.pickup_location}
                  onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Lieu de retour</label>
                <input
                  className={inputClass}
                  placeholder="Identique si vide"
                  value={form.return_location}
                  onChange={(e) => setForm({ ...form, return_location: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Prix total (FCFA) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.price_fcfa || ""}
                  onChange={(e) => setForm({ ...form, price_fcfa: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Caution (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.deposit_fcfa || ""}
                  onChange={(e) => setForm({ ...form, deposit_fcfa: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  rows={2}
                  className={`${inputClass} resize-none`}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
                Annuler
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Création..." : "Créer la réservation"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
