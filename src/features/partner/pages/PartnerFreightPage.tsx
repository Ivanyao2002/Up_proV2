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
import {
  usePartnerFreightOffers,
  useUpdateFreightOffer,
  useCreateFreightOffer,
  useDeleteFreightOffer,
} from "../api/freight.queries";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { FreightOffer } from "../api/freight.service";

export function PartnerFreightPage() {
  const table = useServerTableState([]);
  const [showCreate, setShowCreate] = useState(false);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerFreightOffers(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<FreightOffer>[] = [
    {
      id: "ref",
      header: "Référence",
      cell: (o) => <div className="font-medium">{o.ref}</div>,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (o) => (
        <div className="text-sm">
          <div>{o.origin_label} → {o.destination_label}</div>
          <div className="text-muted text-xs">{o.distance_km} km</div>
        </div>
      ),
    },
    {
      id: "goods",
      header: "Marchandise",
      cell: (o) => (
        <div className="text-sm">
          <div>{o.goods_type}</div>
          <div className="text-muted text-xs">
            {o.weight_kg ? `${o.weight_kg} kg ` : ""}
            {o.volume_m3 ? `${o.volume_m3} m³` : ""}
          </div>
        </div>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: (o) => <div className="text-sm text-muted">{o.client_name || "—"}</div>,
    },
    {
      id: "price",
      header: "Prix",
      cell: (o) => <div className="font-medium text-teal">{formatFCFA(o.price_fcfa)}</div>,
    },
    {
      id: "status",
      header: "Statut",
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      id: "date",
      header: "Demandé le",
      cell: (o) => <span className="text-muted text-sm">{formatDateTime(o.requested_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (o) => <FreightActions offer={o} />,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les offres de fret.</p>;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Offres de fret"
        breadcrumb={["Partenaire", "Opportunités"]}
        actions={
          <Button onClick={() => setShowCreate(true)}>Nouvelle offre</Button>
        }
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Référence, client, origine..."
        totalLabel={meta ? `${meta.total} offre${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        emptyTitle="Aucune offre de fret disponible"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />

      {showCreate && <FreightCreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  const labels: Record<string, string> = {
    pending: "En attente",
    accepted: "Acceptée",
    rejected: "Refusée",
    completed: "Terminée",
    cancelled: "Annulée",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

function FreightActions({ offer }: { offer: FreightOffer }) {
  const update = useUpdateFreightOffer(offer.id);
  const del = useDeleteFreightOffer();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {offer.status === "pending" && (
        <>
          <Button
            className="px-3 py-1.5 text-xs"
            onClick={() => update.mutate({ status: "accepted" })}
            disabled={update.isPending}
          >
            Accepter
          </Button>
          <Button
            className="px-3 py-1.5 text-xs"
            variant="secondary"
            onClick={() => update.mutate({ status: "rejected" })}
            disabled={update.isPending}
          >
            Refuser
          </Button>
        </>
      )}
      <Button
        className="px-3 py-1.5 text-xs"
        variant="secondary"
        onClick={() => setConfirmDelete(true)}
        disabled={del.isPending}
      >
        Supprimer
      </Button>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer l'offre"
        message={`Voulez-vous vraiment supprimer l'offre ${offer.ref} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={() => {
          del.mutate(offer.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function FreightCreateModal({ onClose }: { onClose: () => void }) {
  const create = useCreateFreightOffer();
  const [form, setForm] = useState({
    origin_label: "",
    origin_lat: 0,
    origin_lng: 0,
    destination_label: "",
    destination_lat: 0,
    destination_lng: 0,
    distance_km: 0,
    price_fcfa: 0,
    goods_type: "",
    client_name: "",
    client_phone: "",
    weight_kg: "",
    volume_m3: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        origin_label: form.origin_label,
        origin_lat: Number(form.origin_lat),
        origin_lng: Number(form.origin_lng),
        destination_label: form.destination_label,
        destination_lat: Number(form.destination_lat),
        destination_lng: Number(form.destination_lng),
        distance_km: Number(form.distance_km) || 0,
        price_fcfa: Number(form.price_fcfa) || 0,
        goods_type: form.goods_type,
        client_name: form.client_name,
        client_phone: form.client_phone || undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        volume_m3: form.volume_m3 ? Number(form.volume_m3) : undefined,
        notes: form.notes || undefined,
      },
      { onSuccess: onClose }
    );
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay animate-fade-up"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card bg-surface p-6 shadow-card animate-fade-up">
        <h2 className="text-lg font-semibold text-foreground">Nouvelle offre de fret</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Origine</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("origin_label")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Destination</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("destination_label")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Lat origine</label>
              <input type="number" step="any" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("origin_lat")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Lng origine</label>
              <input type="number" step="any" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("origin_lng")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Lat destination</label>
              <input type="number" step="any" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("destination_lat")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Lng destination</label>
              <input type="number" step="any" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("destination_lng")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Distance (km)</label>
              <input type="number" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("distance_km")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Prix (FCFA)</label>
              <input type="number" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("price_fcfa")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Type de marchandise</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("goods_type")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Client</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("client_name")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Téléphone client</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("client_phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Poids (kg)</label>
              <input type="number" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("weight_kg")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Volume (m³)</label>
              <input type="number" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("volume_m3")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Notes</label>
            <textarea className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-teal" {...field("notes")} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose} type="button">Annuler</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Création…" : "Créer l'offre"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
