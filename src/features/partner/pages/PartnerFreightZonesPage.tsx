"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { useServerTableState, serverPaginationFromMeta } from "@/shared/hooks/useServerTableState";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";

// Icônes SVG inline
const IconMapPin = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const IconTrash2 = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

interface FreightZone {
  id: string;
  name: string;
  type: "zone" | "corridor";
  origin?: string;
  destination?: string;
  polygon?: string;
  active: boolean;
  created_at: string;
}

export function PartnerFreightZonesPage() {
  const table = useServerTableState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState<FreightZone | null>(null);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  // Mock data pour démonstration
  const zones: FreightZone[] = [
    {
      id: "1",
      name: "Abidjan Zone 1",
      type: "zone",
      active: true,
      created_at: "2026-06-01T10:00:00Z",
    },
    {
      id: "2",
      name: "Abidjan - Yamoussoukro",
      type: "corridor",
      origin: "Abidjan",
      destination: "Yamoussoukro",
      active: true,
      created_at: "2026-06-05T14:30:00Z",
    },
  ];

  const columns: Column<FreightZone>[] = [
    {
      id: "name",
      header: "Nom",
      cell: (z) => (
        <div className="flex items-center gap-2">
          <IconMapPin />
          <span className="font-medium">{z.name}</span>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (z) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          z.type === "zone" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
        }`}>
          {z.type === "zone" ? "Zone" : "Couloir"}
        </span>
      ),
    },
    {
      id: "route",
      header: "Trajet",
      cell: (z) => (
        z.type === "corridor" ? (
          <span className="text-sm text-muted">{z.origin} → {z.destination}</span>
        ) : (
          <span className="text-sm text-muted">-</span>
        )
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (z) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          z.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
        }`}>
          {z.active ? "Actif" : "Inactif"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (z) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="px-2 py-1"
            onClick={() => setShowEdit(z)}
          >
            <IconEdit />
          </Button>
          <Button
            variant="secondary"
            className="px-2 py-1 text-red-600"
            onClick={() => setShowDelete(z.id)}
          >
            <IconTrash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Zones & Couloirs"
        breadcrumb={["Partenaire", "Fret", "Zones"]}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <IconPlus />
            Nouvelle zone
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={zones}
            rowKey={(z) => z.id}
            isLoading={false}
            emptyTitle="Aucune zone configurée"
            emptyDescription="Créez des zones ou couloirs pour définir vos zones de service"
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h3 className="font-semibold mb-4">Informations</h3>
            <p className="text-sm text-muted mb-4">
              Les zones et couloirs permettent de définir les zones géographiques 
              dans lesquelles vous opérez.
            </p>
            <ul className="text-sm space-y-2 text-muted">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Zone : Zone de couverture géographique
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Couloir : Route spécifique (origine-destination)
              </li>
            </ul>
          </div>

          <div className="rounded-card bg-surface p-6 shadow-card">
            <h3 className="font-semibold mb-4">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">Zones actives</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Couloirs actifs</span>
                <span className="font-medium">1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création simple */}
      {showCreate && (
        <ZoneCreateModal onClose={() => setShowCreate(false)} />
      )}

      {/* Modal de suppression */}
      {showDelete && (
        <ConfirmModal
          open={true}
          title="Supprimer la zone"
          message="Voulez-vous vraiment supprimer cette zone ?"
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={() => setShowDelete(null)}
          onCancel={() => setShowDelete(null)}
        />
      )}
    </div>
  );
}

function ZoneCreateModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    type: "zone" as "zone" | "corridor",
    origin: "",
    destination: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-card bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold">Nouvelle zone/couloir</h2>
        <form className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              placeholder="Ex: Abidjan Zone 1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "zone" | "corridor" })}
            >
              <option value="zone">Zone géographique</option>
              <option value="corridor">Couloir (origine-destination)</option>
            </select>
          </div>
          {form.type === "corridor" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Origine</label>
                <input
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                  placeholder="Ville d'origine"
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Destination</label>
                <input
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                  placeholder="Ville de destination"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button>Créer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
