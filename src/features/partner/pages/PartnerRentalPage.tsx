"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { formatFCFA } from "@/shared/lib/format";
import { usePartnerRentalOffers, useUpdateRentalOffer, useCreateRentalOffer } from "../api/rental.queries";
import type { RentalOffer, RentalOfferStatus, CreateRentalOfferPayload } from "../api/rental.service";

// Icônes SVG inline
const IconCalendar = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconCar = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconCheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconXCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;

export function PartnerRentalPage() {
  const table = useServerTableState([]);
  const [showCreate, setShowCreate] = useState(false);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading } = usePartnerRentalOffers(table.listParams);
  const offers = data?.data ?? [];
  const pagination = serverPaginationFromMeta(data?.meta, table.setPage, table.setPageSize);

  const statusConfig: Record<RentalOfferStatus, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
    rejected: { label: "Refusée", color: "bg-red-100 text-red-700" },
    active: { label: "En cours", color: "bg-green-100 text-green-700" },
    completed: { label: "Terminée", color: "bg-gray-100 text-gray-700" },
    cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
  };

  const columns: Column<RentalOffer>[] = [
    {
      id: "ref",
      header: "Référence",
      cell: (o) => <div className="font-medium">{o.ref}</div>,
    },
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (o) => (
        <div className="flex items-center gap-2">
          <IconCar />
          <span>{o.vehicle_label ?? "—"}</span>
        </div>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: (o) => (
        <div className="flex items-center gap-2">
          <IconUser />
          <div>
            <div className="text-sm">{o.client_name}</div>
            {o.client_phone && <div className="text-xs text-muted">{o.client_phone}</div>}
          </div>
        </div>
      ),
    },
    {
      id: "dates",
      header: "Période",
      cell: (o) => (
        <div className="flex items-center gap-2">
          <IconCalendar />
          <div className="text-sm">
            <div>{new Date(o.pickup_date).toLocaleDateString()} → {new Date(o.return_date).toLocaleDateString()}</div>
          </div>
        </div>
      ),
    },
    {
      id: "price",
      header: "Prix",
      cell: (o) => (
        <div>
          <div className="font-medium text-teal">{formatFCFA(o.price_fcfa)}</div>
          {o.deposit_fcfa && <div className="text-xs text-muted">Caution: {formatFCFA(o.deposit_fcfa)}</div>}
        </div>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (o) => {
        const config = statusConfig[o.status];
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: (o) => <RentalActions offer={o} />,
    },
  ];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Réservations Location"
        breadcrumb={["Partenaire", "Location"]}
        actions={
          <Button onClick={() => setShowCreate(true)}>Nouvelle réservation</Button>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Référence, client, véhicule..."
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={offers}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        pagination={pagination}
        emptyTitle="Aucune réservation"
        emptyDescription="Les demandes de location apparaîtront ici"
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
    create.mutate(form, { onSuccess });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-card bg-surface p-6 shadow-card overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4">Nouvelle réservation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nom du client *</label>
              <input
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                placeholder="Kouassi Jean"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Téléphone client</label>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                placeholder="+225 07 00 00 00 00"
                value={form.client_phone}
                onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date de prise en charge *</label>
              <input
                required
                type="datetime-local"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={form.pickup_date}
                onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date de retour *</label>
              <input
                required
                type="datetime-local"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Lieu de prise en charge *</label>
              <input
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                placeholder="Abidjan, Plateau"
                value={form.pickup_location}
                onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Lieu de retour</label>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                placeholder="Identique si vide"
                value={form.return_location}
                onChange={(e) => setForm({ ...form, return_location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prix total (FCFA) *</label>
              <input
                required
                type="number"
                min="0"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={form.price_fcfa || ""}
                onChange={(e) => setForm({ ...form, price_fcfa: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Caution (FCFA)</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                value={form.deposit_fcfa || ""}
                onChange={(e) => setForm({ ...form, deposit_fcfa: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 resize-none"
                placeholder="Instructions particulières..."
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
  );
}

function RentalActions({ offer }: { offer: RentalOffer }) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const update = useUpdateRentalOffer();

  const actionMap: Record<string, { status: import("../api/rental.service").RentalOfferStatus; label: string }> = {
    confirm: { status: "confirmed", label: "Confirmée" },
    reject: { status: "rejected", label: "Refusée" },
    start: { status: "active", label: "Démarrée" },
    complete: { status: "completed", label: "Terminée" },
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const action = actionMap[confirmAction];
    if (action) {
      update.mutate({ id: offer.id, data: { status: action.status } });
    }
    setConfirmAction(null);
  };

  return (
    <div className="flex items-center gap-2">
      {offer.status === "pending" && (
        <>
          <Button
            className="px-3 py-1.5 text-xs"
            onClick={() => setConfirmAction("confirm")}
          >
            <IconCheckCircle />
            Confirmer
          </Button>
          <Button
            className="px-3 py-1.5 text-xs"
            variant="secondary"
            onClick={() => setConfirmAction("reject")}
          >
            <IconXCircle />
            Refuser
          </Button>
        </>
      )}
      {offer.status === "confirmed" && (
        <Button
          className="px-3 py-1.5 text-xs"
          onClick={() => setConfirmAction("start")}
        >
          Check-in
        </Button>
      )}
      {offer.status === "active" && (
        <Button
          className="px-3 py-1.5 text-xs"
          variant="secondary"
          onClick={() => setConfirmAction("complete")}
        >
          Check-out
        </Button>
      )}

      {confirmAction && (
        <ConfirmModal
          open={true}
          title="Confirmer l'action"
          message={`Voulez-vous ${actionMap[confirmAction]?.label ?? confirmAction} cette réservation ?`}
          confirmLabel="Confirmer"
          cancelLabel="Annuler"
          variant={confirmAction === "reject" ? "danger" : "primary"}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
